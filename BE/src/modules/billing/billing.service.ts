import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingInvoiceStatus } from '../../common/enums/billing-invoice-status.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import {
  BILLING_PAYMENT_TIMEOUT_MINUTES,
  PLAN_PRICING_VND,
  SUBSCRIPTION_PERIOD_DAYS,
} from '../../common/saas/plan-limits';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentsService } from '../payments/payments.service';
import { MomoIpnPayload, MomoPaymentService } from './momo-payment.service';
import { BillingInvoice, BillingInvoiceDocument } from './schemas/billing-invoice.schema';

@Injectable()
export class BillingService {
  private readonly paymentTimeoutMs = BILLING_PAYMENT_TIMEOUT_MINUTES * 60_000;

  constructor(
    @InjectModel(BillingInvoice.name)
    private readonly invoiceModel: Model<BillingInvoiceDocument>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly momoPayment: MomoPaymentService,
    private readonly paymentsService: PaymentsService,
  ) {}

  momoConfig() {
    return {
      enabled: this.momoPayment.isEnabled(),
      redirectUrl:
        process.env.MOMO_REDIRECT_URL?.trim() ||
        'http://localhost:3000/dashboard/admin/billing/result',
      paymentTimeoutMinutes: BILLING_PAYMENT_TIMEOUT_MINUTES,
    };
  }

  /** Thông tin CK gói SaaS — ưu tiên VIETQR_* (cùng nguồn với QR động) */
  getBankTransferInfo() {
    const vietQrAccount = process.env.VIETQR_ACCOUNT_NO?.trim();
    const vietQrBank = process.env.VIETQR_BANK_NAME?.trim();
    const vietQrHolder = process.env.VIETQR_ACCOUNT_NAME?.trim();

    const bank = vietQrBank || process.env.SAAS_BANK_NAME?.trim() || 'Techcombank';
    const account =
      vietQrAccount || process.env.SAAS_BANK_ACCOUNT?.trim() || '9528677537';
    const holder =
      vietQrHolder || process.env.SAAS_BANK_HOLDER?.trim() || 'NGUYEN HOANG MINH NHAT';
    const qrPath = process.env.SAAS_BANK_QR_URL?.trim() || '/billing/qr-bank.jpg';
    const note = process.env.SAAS_BANK_NOTE?.trim() || '';
    return {
      bank,
      account,
      holder,
      qrUrl: qrPath,
      note,
      transferPrefix: process.env.SAAS_BANK_TRANSFER_PREFIX?.trim() || 'BOBAPOS',
      paymentTimeoutMinutes: BILLING_PAYMENT_TIMEOUT_MINUTES,
    };
  }

  private async expireStalePendingInvoices(tenantId: string): Promise<void> {
    const now = new Date();
    const legacyCutoff = new Date(now.getTime() - this.paymentTimeoutMs);

    await this.invoiceModel
      .updateMany(
        {
          tenantId: new Types.ObjectId(tenantId),
          status: BillingInvoiceStatus.PENDING,
          $or: [
            { expiresAt: { $lt: now } },
            {
              expiresAt: { $exists: false },
              createdAt: { $lt: legacyCutoff },
            },
          ],
        },
        { status: BillingInvoiceStatus.EXPIRED },
      )
      .exec();
  }

  private async assertCanCreateCheckout(tenantId: string): Promise<void> {
    await this.expireStalePendingInvoices(tenantId);

    const pending = await this.invoiceModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        status: BillingInvoiceStatus.PENDING,
      })
      .exec();

    if (pending) {
      throw new BadRequestException(
        `Bạn đã có hóa đơn chờ thanh toán. Quét QR và chuyển khoản trong ${BILLING_PAYMENT_TIMEOUT_MINUTES} phút, hoặc đợi hết hạn rồi tạo hóa đơn mới.`,
      );
    }
  }

  async listByTenant(tenantId: string) {
    await this.expireStalePendingInvoices(tenantId);
    return this.invoiceModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getInvoiceForTenant(tenantId: string, invoiceId: string) {
    await this.expireStalePendingInvoices(tenantId);
    const invoice = await this.invoiceModel.findById(invoiceId).exec();
    if (!invoice || invoice.tenantId.toString() !== tenantId) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    return invoice;
  }

  private async createPendingInvoice(
    tenantId: string,
    plan: SubscriptionPlan,
    paymentMethod: 'MANUAL' | 'MOMO' | 'BANK_TRANSFER',
  ) {
    const amount = PLAN_PRICING_VND[plan];
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + SUBSCRIPTION_PERIOD_DAYS);
    const expiresAt = new Date(now.getTime() + this.paymentTimeoutMs);

    return new this.invoiceModel({
      tenantId: new Types.ObjectId(tenantId),
      plan,
      amount,
      currency: 'VND',
      status: BillingInvoiceStatus.PENDING,
      paymentMethod,
      periodStart: now,
      periodEnd,
      expiresAt,
      note: `Gói ${SUBSCRIPTION_PERIOD_DAYS} ngày — ${plan}`,
    }).save();
  }

  async createCheckout(tenantId: string, plan: SubscriptionPlan) {
    await this.assertCanCreateCheckout(tenantId);
    const invoice = await this.createPendingInvoice(
      tenantId,
      plan,
      'BANK_TRANSFER',
    );
    return this.paymentsService.setupBillingBankPayment(invoice);
  }

  async createMomoCheckout(tenantId: string, plan: SubscriptionPlan) {
    if (!this.momoPayment.isEnabled()) {
      throw new BadRequestException(
        'MoMo chưa được cấu hình. Thêm MOMO_* vào BE/.env hoặc dùng chuyển khoản thủ công.',
      );
    }

    await this.assertCanCreateCheckout(tenantId);
    const invoice = await this.createPendingInvoice(tenantId, plan, 'MOMO');
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

  /** Kích hoạt sau thanh toán tự động (SePay / MoMo IPN) */
  async markPaidAndActivate(invoiceId: string) {
    const invoice = await this.invoiceModel.findById(invoiceId).exec();
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');

    if (invoice.status === BillingInvoiceStatus.PAID) {
      return invoice;
    }

    if (invoice.status !== BillingInvoiceStatus.PENDING) {
      throw new BadRequestException('Hóa đơn không còn hiệu lực thanh toán');
    }

    if (invoice.expiresAt && invoice.expiresAt.getTime() < Date.now()) {
      invoice.status = BillingInvoiceStatus.EXPIRED;
      await invoice.save();
      throw new BadRequestException('Hóa đơn đã hết hạn thanh toán (10 phút)');
    }

    invoice.status = BillingInvoiceStatus.PAID;
    await invoice.save();

    await this.subscriptionsService.activateAfterPayment(
      invoice.tenantId.toString(),
      invoice.plan,
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
