import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMatchStatus } from '../../../common/enums/payment-status.enum';
import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';

export type PaymentTransactionDocument = PaymentTransaction & Document;

@Schema({ timestamps: true, collection: 'payment_transactions' })
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  sepayId: number;

  @Prop({ required: true, trim: true })
  gateway: string;

  @Prop({ required: true })
  transactionDate: Date;

  @Prop({ required: true, trim: true })
  accountNumber: string;

  @Prop({ required: true, min: 0 })
  transferAmount: number;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ trim: true, uppercase: true, index: true })
  paymentCode?: string;

  @Prop({ trim: true })
  referenceCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  matchedOrderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BillingInvoice' })
  matchedInvoiceId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: PaymentMatchStatus,
    default: PaymentMatchStatus.RECEIVED,
  })
  matchStatus: PaymentMatchStatus;

  @Prop({ type: Object, required: true })
  rawPayload: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);

PaymentTransactionSchema.index({ tenantId: 1, createdAt: -1 });
applyTenantPlugin(PaymentTransactionSchema);

PaymentTransactionSchema.set('toJSON', {
  transform: (_doc, ret) => ({
    id: ret._id?.toString(),
    tenantId: ret.tenantId?.toString(),
    sepayId: ret.sepayId,
    gateway: ret.gateway,
    transactionDate: ret.transactionDate,
    accountNumber: ret.accountNumber,
    transferAmount: ret.transferAmount,
    content: ret.content,
    paymentCode: ret.paymentCode,
    referenceCode: ret.referenceCode,
    matchedOrderId: ret.matchedOrderId?.toString(),
    matchedInvoiceId: ret.matchedInvoiceId?.toString(),
    matchStatus: ret.matchStatus,
    rawPayload: ret.rawPayload,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  }),
});
