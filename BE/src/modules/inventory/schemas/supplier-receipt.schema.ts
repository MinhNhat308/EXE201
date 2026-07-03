import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';

export type SupplierReceiptDocument = SupplierReceipt & Document;

@Schema({ _id: false })
export class SupplierReceiptLine {
  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true })
  ingredientId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ default: 0 })
  unitPrice: number;

  @Prop()
  expiryDate?: Date;
}

export const SupplierReceiptLineSchema =
  SchemaFactory.createForClass(SupplierReceiptLine);

@Schema({ timestamps: true, collection: 'supplier_receipts' })
export class SupplierReceipt {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  supplierName: string;

  @Prop({ required: true, trim: true })
  documentNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'WarehouseLocation', required: true })
  warehouseId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  warehouseCode: string;

  @Prop({ required: true, trim: true })
  warehouseName: string;

  @Prop({ required: true })
  documentDate: Date;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: [SupplierReceiptLineSchema], required: true })
  lines: SupplierReceiptLine[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  createdByName?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupplierReceiptSchema =
  SchemaFactory.createForClass(SupplierReceipt);

SupplierReceiptSchema.index({ tenantId: 1, documentNumber: 1 });
applyTenantPlugin(SupplierReceiptSchema);

SupplierReceiptSchema.set('toJSON', {
  transform: (_doc, ret) => ({
    id: ret._id?.toString(),
    supplierName: ret.supplierName,
    documentNumber: ret.documentNumber,
    warehouseId: ret.warehouseId?.toString(),
    warehouseCode: ret.warehouseCode,
    warehouseName: ret.warehouseName,
    documentDate: ret.documentDate,
    note: ret.note,
    lines: ret.lines?.map(
      (l: SupplierReceiptLine & { ingredientId?: { toString(): string } }) => ({
        ingredientId: l.ingredientId?.toString?.() ?? l.ingredientId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        expiryDate: l.expiryDate,
      }),
    ),
    createdBy: ret.createdBy?.toString(),
    createdByName: ret.createdByName,
    createdAt: ret.createdAt,
  }),
});
