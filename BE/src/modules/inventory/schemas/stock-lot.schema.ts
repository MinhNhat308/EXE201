import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';

export type StockLotDocument = StockLot & Document;

@Schema({ timestamps: true, collection: 'stock_lots' })
export class StockLot {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WarehouseLocation', required: true, index: true })
  warehouseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true, index: true })
  ingredientId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop()
  expiryDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'SupplierReceipt' })
  supplierReceiptId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StockTransferRequest' })
  stockRequestId?: Types.ObjectId;

  @Prop({ default: () => new Date() })
  receivedAt: Date;
}

export const StockLotSchema = SchemaFactory.createForClass(StockLot);
StockLotSchema.index({ warehouseId: 1, ingredientId: 1, expiryDate: 1 });
applyTenantPlugin(StockLotSchema);
