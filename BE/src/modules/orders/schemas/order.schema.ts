import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { WorkShift } from '../../../common/enums/work-shift.enum';
import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';
import { ToppingOption, ToppingOptionSchema } from '../../menu/schemas/topping.schema';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderLineItem {
  @Prop({ type: Types.ObjectId, required: true })
  menuItemId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ type: [ToppingOptionSchema], default: [] })
  toppings: ToppingOption[];

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop()
  note?: string;

  /** % đường khách chọn (10–100, 0 = không); công thức quán = 100% */
  @Prop()
  sugarPercent?: number;

  /** % đá khách chọn */
  @Prop()
  icePercent?: number;
}

export const OrderLineItemSchema = SchemaFactory.createForClass(OrderLineItem);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;

  @Prop({ required: true })
  orderNumber: string;

  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ type: [OrderLineItemSchema], required: true })
  items: OrderLineItem[];

  @Prop()
  customerName?: string;

  @Prop()
  customerPhone?: string;

  @Prop()
  tableNumber?: string;

  @Prop()
  note?: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ required: true })
  dailySequence: number;

  @Prop({ required: true, enum: WorkShift })
  workShift: WorkShift;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staffId: Types.ObjectId;

  @Prop({ required: true })
  staffName: string;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop()
  cancelReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop({ default: false })
  inventoryDeducted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
applyTenantPlugin(OrderSchema);

OrderSchema.set('toJSON', {
  transform: (_doc, ret) => ({
    id: ret._id?.toString(),
    orderNumber: ret.orderNumber,
    invoiceNumber: ret.invoiceNumber,
    items: ret.items?.map(
      (item: OrderLineItem & { menuItemId?: { toString(): string } }) => ({
        menuItemId: item.menuItemId?.toString?.() ?? item.menuItemId,
        name: item.name,
        basePrice: item.basePrice,
        toppings: item.toppings ?? [],
        price: item.price,
        quantity: item.quantity,
        note: item.note,
        sugarPercent: item.sugarPercent,
        icePercent: item.icePercent,
      }),
    ),
    customerName: ret.customerName,
    customerPhone: ret.customerPhone,
    tableNumber: ret.tableNumber,
    note: ret.note,
    paymentMethod: ret.paymentMethod,
    dailySequence: ret.dailySequence,
    workShift: ret.workShift,
    staffId: ret.staffId?.toString(),
    staffName: ret.staffName,
    subtotal: ret.subtotal,
    total: ret.total,
    status: ret.status,
    cancelReason: ret.cancelReason,
    cancelledAt: ret.cancelledAt,
    inventoryDeducted: ret.inventoryDeducted,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  }),
});
