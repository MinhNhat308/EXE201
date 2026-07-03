import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';

export type WarehouseLocationDocument = WarehouseLocation & Document;

@Schema({ timestamps: true, collection: 'warehouse_locations' })
export class WarehouseLocation {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  /** Kho mặc định trừ khi bếp hoàn thành đơn */
  @Prop({ default: false })
  isKitchenSource: boolean;

  /** Kho tổng — chỉ kế toán nhập NCC */
  @Prop({ default: false })
  isCentralWarehouse: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WarehouseLocationSchema =
  SchemaFactory.createForClass(WarehouseLocation);

WarehouseLocationSchema.index({ tenantId: 1, code: 1 }, { unique: true });
applyTenantPlugin(WarehouseLocationSchema);

WarehouseLocationSchema.set('toJSON', {
  transform: (_doc, ret) => ({
    id: ret._id?.toString(),
    code: ret.code,
    name: ret.name,
    description: ret.description,
    sortOrder: ret.sortOrder,
    isActive: ret.isActive,
    isKitchenSource: ret.isKitchenSource,
    isCentralWarehouse: ret.isCentralWarehouse,
    branchId: ret.branchId?.toString(),
  }),
});
