import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaymentMatchStatus,
  PaymentStatus,
} from '../../common/enums/payment-status.enum';
import { BillingInvoiceStatus } from '../../common/enums/billing-invoice-status.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { BillingInvoice, BillingInvoiceDocument } from '../billing/schemas/billing-invoice.schema';
import { InventoryService } from '../inventory/inventory.service';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TenantsService } from '../tenants/tenants.service';
import { SepayService, SepayWebhookPayload } from './sepay.service';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from './schemas/payment-transaction.schema';
import { VietQrService } from './vietqr.service';

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(PaymentTransaction.name)
    private readonly txModel: Model<PaymentTransactionDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(BillingInvoice.name)
    private readonly invoiceModel: Model<BillingInvoiceDocument>,
    private readonly vietQr: VietQrService,
    private readonly sepay: SepayService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly tenantsService: TenantsService,
    private readonly inventoryService: InventoryService,
  ) {}

  getConfig() {
    return {
      sepayEnabled: this.sepay.isEnabled(),
      vietqrEnabled: this.vietQr.isEnabled(),
      paymentCodePrefix: this.vietQr.paymentPrefix(),
      bankAccountInfo: this.vietQr.isEnabled()
        ? this.vietQr.bankAccountInfo()
        : null,
    };
  }

  async setupOrderBankPayment(order: OrderDocument): Promise<OrderDocument> {
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      order.paymentStatus = PaymentStatus.NOT_REQUIRED;
      return order.save();
    }

    if (!this.vietQr.isEnabled()) {
      order.paymentStatus = PaymentStatus.PENDING;
      order.paymentCode = this.vietQr.buildPaymentCode(order.dailySequence);
      return order.save();
    }

    const paymentCode = this.vietQr.buildPaymentCode(order.dailySequence);
    const qr = await this.vietQr.generateQr({
      amount: order.total,
      paymentCode,
    });

    order.paymentCode = qr.paymentCode;
    order.paymentQrUrl = qr.qrImageUrl;
    order.paymentStatus = PaymentStatus.PENDING;
    order.paymentBankInfo = qr.bankAccountInfo;
    return order.save();
  }

  async setupBillingBankPayment(
    invoice: BillingInvoiceDocument,
  ): Promise<BillingInvoiceDocument> {
    const paymentCode = this.vietQr.buildPaymentCodeFromId(
      invoice._id.toString(),
    );

    if (!this.vietQr.isEnabled()) {
      invoice.paymentCode = paymentCode;
      invoice.paymentMethod = 'BANK_TRANSFER';
      return invoice.save();
    }

    const qr = await this.vietQr.generateQr({
      amount: invoice.amount,
      paymentCode,
    });

    invoice.paymentCode = qr.paymentCode;
    invoice.paymentQrUrl = qr.qrImageUrl;
    invoice.paymentMethod = 'BANK_TRANSFER';
    return invoice.save();
  }

  async refreshOrderQr(orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new BadRequestException('Đơn không phải chuyển khoản');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      return order;
    }
    return this.setupOrderBankPayment(order);
  }

  async handleSepayWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    parsed: Record<string, unknown>,
  ): Promise<{ success: boolean }> {
    if (!this.sepay.isEnabled()) {
      this.log.warn('SePay webhook received but SEPAY_ENABLED=false');
      return { success: true };
    }

    const signature = String(headers['x-sepay-signature'] ?? '');
    const timestamp = Number(headers['x-sepay-timestamp'] ?? 0);

    if (
      process.env.SEPAY_WEBHOOK_SECRET?.trim() &&
      !this.sepay.verifyHmac(rawBody, signature, timestamp)
    ) {
      throw new BadRequestException('Chữ ký SePay không hợp lệ');
    }

    const payload = this.sepay.parsePayload(parsed);
    if (!payload) {
      this.log.warn('SePay payload không hợp lệ');
      return { success: true };
    }

    const existing = await this.txModel
      .findOne({ sepayId: payload.id })
      .exec();
    if (existing) {
      existing.matchStatus = PaymentMatchStatus.DUPLICATE;
      await existing.save();
      return { success: true };
    }

    const paymentCode =
      this.vietQr.extractPaymentCode(payload.content) ??
      (payload.code
        ? this.vietQr.extractPaymentCode(payload.code) ?? payload.code.toUpperCase()
        : undefined);

    const tx = await this.txModel.create({
      sepayId: payload.id,
      gateway: payload.gateway,
      transactionDate: new Date(payload.transactionDate),
      accountNumber: payload.accountNumber,
      transferAmount: payload.transferAmount,
      content: payload.content,
      paymentCode,
      referenceCode: payload.referenceCode,
      matchStatus: PaymentMatchStatus.RECEIVED,
      rawPayload: parsed,
    });

    if (!paymentCode) {
      tx.matchStatus = PaymentMatchStatus.UNMATCHED;
      await tx.save();
      return { success: true };
    }

    const order = await this.orderModel
      .findOne({
        paymentCode,
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: PaymentStatus.PENDING,
      })
      .exec();

    if (order) {
      if (Math.round(order.total) !== Math.round(payload.transferAmount)) {
        tx.matchStatus = PaymentMatchStatus.AMOUNT_MISMATCH;
        tx.matchedOrderId = order._id;
        tx.tenantId = order.tenantId;
        await tx.save();
        this.log.warn(
          `SePay amount mismatch order=${order._id} expected=${order.total} got=${payload.transferAmount}`,
        );
        return { success: true };
      }

      order.paymentStatus = PaymentStatus.PAID;
      order.paidAt = new Date();
      await order.save();
      await this.afterOrderPaid(order);

      tx.matchStatus = PaymentMatchStatus.MATCHED;
      tx.matchedOrderId = order._id;
      tx.tenantId = order.tenantId;
      await tx.save();

      this.log.log(
        `SePay matched order ${order.orderNumber} code=${paymentCode} amount=${payload.transferAmount}`,
      );
      return { success: true };
    }

    const invoice = await this.invoiceModel
      .findOne({
        paymentCode,
        status: BillingInvoiceStatus.PENDING,
      })
      .exec();

    if (invoice) {
      if (Math.round(invoice.amount) !== Math.round(payload.transferAmount)) {
        tx.matchStatus = PaymentMatchStatus.AMOUNT_MISMATCH;
        tx.matchedInvoiceId = invoice._id;
        tx.tenantId = invoice.tenantId;
        await tx.save();
        return { success: true };
      }

      invoice.status = BillingInvoiceStatus.PAID;
      invoice.gatewayRef = String(payload.id);
      await invoice.save();
      await this.activateBillingInvoice(invoice);

      tx.matchStatus = PaymentMatchStatus.MATCHED;
      tx.matchedInvoiceId = invoice._id;
      tx.tenantId = invoice.tenantId;
      await tx.save();

      this.log.log(
        `SePay matched billing invoice ${invoice._id} code=${paymentCode}`,
      );

      return { success: true };
    }

    tx.matchStatus = PaymentMatchStatus.UNMATCHED;
    await tx.save();
    this.log.warn(`SePay unmatched code=${paymentCode} id=${payload.id}`);
    return { success: true };
  }

  async listTransactions(limit = 50, tenantId?: string) {
    const filter: Record<string, unknown> = {};
    if (tenantId) {
      filter.tenantId = new Types.ObjectId(tenantId);
    }
    return this.txModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async markOrderPaidManually(orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new BadRequestException('Đơn không phải chuyển khoản');
    }
    order.paymentStatus = PaymentStatus.PAID;
    order.paidAt = new Date();
    await order.save();
    await this.afterOrderPaid(order);
    return order;
  }

  private async afterOrderPaid(order: OrderDocument): Promise<void> {
    if (!order.tenantId) return;
    try {
      const tenant = await this.tenantsService.findById(order.tenantId.toString());
      if (tenant.intendedPlan !== SubscriptionPlan.SOLO) return;
      if (tenant.settings?.trackInventory === false) return;
      if (order.inventoryDeducted) return;
      await this.inventoryService.deductForOrder(order._id.toString());
    } catch (err) {
      this.log.warn(
        `afterOrderPaid inventory: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async activateBillingInvoice(
    invoice: BillingInvoiceDocument,
  ): Promise<void> {
    await this.subscriptionsService.activateAfterPayment(
      invoice.tenantId.toString(),
      invoice.plan,
    );
  }
}
