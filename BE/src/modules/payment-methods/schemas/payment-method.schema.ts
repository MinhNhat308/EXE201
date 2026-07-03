import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';

export type PaymentMethodDocument = PaymentMethodConfig & Document;

@Schema({ timestamps: true, collection: 'payment_methods' })
export class PaymentMethodConfig {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  /** Ảnh QR (URL hoặc data URL) — Solo CK/QR */
  @Prop()
  qrImageUrl?: string;

  /** Ghi chú STK / ngân hàng hiển thị cùng QR */
  @Prop({ trim: true })
  bankAccountInfo?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethodConfig);

PaymentMethodSchema.index({ tenantId: 1, code: 1 }, { unique: true });
applyTenantPlugin(PaymentMethodSchema);

PaymentMethodSchema.set('toJSON', {
  transform: (_doc, ret) => ({
    id: ret._id?.toString(),
    code: ret.code,
    label: ret.label,
    description: ret.description,
    isActive: ret.isActive,
    sortOrder: ret.sortOrder,
    qrImageUrl: ret.qrImageUrl,
    bankAccountInfo: ret.bankAccountInfo,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  }),
});
