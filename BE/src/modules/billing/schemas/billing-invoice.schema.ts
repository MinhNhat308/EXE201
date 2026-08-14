import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BillingInvoiceStatus } from '../../../common/enums/billing-invoice-status.enum';
import { SubscriptionPlan } from '../../../common/enums/subscription-plan.enum';

export type BillingInvoiceDocument = BillingInvoice & Document;

@Schema({ timestamps: true, collection: 'billing_invoices' })
export class BillingInvoice {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({ required: true, enum: BillingInvoiceStatus, default: BillingInvoiceStatus.PENDING })
  status: BillingInvoiceStatus;

  @Prop({ default: 'MANUAL' })
  paymentMethod: string;

  @Prop()
  gatewayRef?: string;

  @Prop()
  periodStart?: Date;

  @Prop()
  periodEnd?: Date;

  @Prop()
  note?: string;

  @Prop({ trim: true, uppercase: true })
  paymentCode?: string;

  @Prop()
  paymentQrUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BillingInvoiceSchema = SchemaFactory.createForClass(BillingInvoice);

BillingInvoiceSchema.set('toJSON', {
  transform: (_doc, ret) => ({
    id: ret._id?.toString(),
    tenantId: ret.tenantId?.toString(),
    plan: ret.plan,
    amount: ret.amount,
    currency: ret.currency,
    status: ret.status,
    paymentMethod: ret.paymentMethod,
    gatewayRef: ret.gatewayRef,
    periodStart: ret.periodStart,
    periodEnd: ret.periodEnd,
    note: ret.note,
    paymentCode: ret.paymentCode,
    paymentQrUrl: ret.paymentQrUrl,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  }),
});
