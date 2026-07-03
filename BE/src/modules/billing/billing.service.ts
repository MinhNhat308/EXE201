import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingInvoiceStatus } from '../../common/enums/billing-invoice-status.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { PLAN_PRICING_VND } from '../../common/saas/plan-limits';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MomoIpnPayload, MomoPaymentService } from './momo-payment.service';
import { BillingInvoice, BillingInvoiceDocument } from './schemas/billing-invoice.schema';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(BillingInvoice.name)
    private readonly invoiceModel: Model<BillingInvoiceDocument>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly momoPayment: MomoPaymentService,
  ) {}

  momoConfig() {
    return {
      enabled: this.momoPayment.isEnabled(),
      redirectUrl:
        process.env.MOMO_REDIRECT_URL?.trim() ||
        'http://localhost:3000/dashboard/admin/billing/result',
    };
  }

  /** Thông tin CK gói SaaS — cấu hình qua SAAS_BANK_* trong .env */
  getBankTransferInfo() {
    const bank = process.env.SAAS_BANK_NAME?.trim() || 'Techcombank';
    const account = process.env.SAAS_BANK_ACCOUNT?.trim() || '9528677537';
    const holder = process.env.SAAS_BANK_HOLDER?.trim() || 'NGUYEN HOANG MINH NHAT';
    const qrPath = process.env.SAAS_BANK_QR_URL?.trim() || '/billing/qr-bank.jpg';
    const note = process.env.SAAS_BANK_NOTE?.trim() || '';
    return {
      bank,
      account,
      holder,
      qrUrl: qrPath,
      note,
      transferPrefix: process.env.SAAS_BANK_TRANSFER_PREFIX?.trim() || 'BOBAPOS',
    };
  }

  async listByTenant(tenantId: string) {
    return this.invoiceModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getInvoiceForTenant(tenantId: string, invoiceId: string) {
    const invoice = await this.invoiceModel.findById(invoiceId).exec();
    if (!invoice || invoice.tenantId.toString() !== tenantId) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    return invoice;
  }

  private async createPendingInvoice(
    tenantId: string,
    plan: SubscriptionPlan,
    months: number,
    paymentMethod: 'MANUAL' | 'MOMO',
  ) {
    const amount = PLAN_PRICING_VND[plan] * months;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + months);

    return new this.invoiceModel({
      tenantId: new Types.ObjectId(tenantId),
      plan,
      amount,
      currency: 'VND',
      status: BillingInvoiceStatus.PENDING,
      paymentMethod,
      periodStart: now,
      periodEnd,
      note: `Gia hạn ${months} tháng — ${plan}`,
    }).save();
  }

  async createCheckout(tenantId: string, plan: SubscriptionPlan, months = 1) {
    return this.createPendingInvoice(tenantId, plan, months, 'MANUAL');
  }

  async createMomoCheckout(tenantId: string, plan: SubscriptionPlan, months = 1) {
    if (!this.momoPayment.isEnabled()) {
      throw new BadRequestException(
        'MoMo chưa được cấu hình. Thêm MOMO_* vào BE/.env hoặc dùng chuyển khoản thủ công.',
      );
    }

    const invoice = await this.createPendingInvoice(tenantId, plan, months, 'MOMO');
    const orderId = invoice._id.toString();

    const momo = await this.momoPayment.createPayment({
      orderId,
      amount: invoice.amount,
      orderInfo: invoice.note ?? `BOBAPOS ${plan}`,
    });

    invoice.gatewayRef = momo.requestId;
    await invoice.save();

    return {
      invoice: invoice.toJSON(),
      payUrl: momo.payUrl,
      deeplink: momo.deeplink,
      qrCodeUrl: momo.qrCodeUrl,
    };
  }

  /** Kích hoạt sau thanh toán (manual / MoMo IPN) */
  async markPaidAndActivate(invoiceId: string) {
    const invoice = await this.invoiceModel.findById(invoiceId).exec();
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');

    if (invoice.status === BillingInvoiceStatus.PAID) {
      return invoice;
    }

    invoice.status = BillingInvoiceStatus.PAID;
    await invoice.save();

    const periodStart = invoice.periodStart ?? new Date();
    const periodEnd = invoice.periodEnd ?? new Date();
    const months = Math.max(
      1,
      Math.round(
        (periodEnd.getTime() - periodStart.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      ) || 1,
    );

    await this.subscriptionsService.activateAfterPayment(
      invoice.tenantId.toString(),
      invoice.plan,
      months,
    );

    return invoice;
  }

  /** MoMo gọi IPN — xác thực chữ ký và kích hoạt gói realtime */
  async handleMomoIpn(payload: MomoIpnPayload) {
    if (!this.momoPayment.verifyIpnSignature(payload)) {
      throw new BadRequestException('Chữ ký MoMo không hợp lệ');
    }

    const orderId = payload.orderId;
    if (!orderId) {
      throw new BadRequestException('Thiếu orderId');
    }

    if (payload.resultCode !== 0) {
      return { acknowledged: true, activated: false, resultCode: payload.resultCode };
    }

    const invoice = await this.invoiceModel.findById(orderId).exec();
    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn theo orderId');
    }

    if (invoice.amount !== payload.amount) {
      throw new BadRequestException('Số tiền không khớp hóa đơn');
    }

    await this.markPaidAndActivate(orderId);
    return { acknowledged: true, activated: true, invoiceId: orderId };
  }
}
