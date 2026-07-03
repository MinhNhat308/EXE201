import { Topping } from './menu.model';
import { WorkShift } from './staff.model';

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  CONFIRMED = 'CONFIRMED',
  SERVING = 'SERVING',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: 'Chưa thực hiện',
  [OrderStatus.PREPARING]: 'Đang thực hiện',
  [OrderStatus.READY]: 'Sẵn sàng bưng',
  [OrderStatus.COMPLETED]: 'Hoàn tất',
  [OrderStatus.CANCELLED]: 'Đã hủy',
  [OrderStatus.CONFIRMED]: 'Chưa thực hiện',
  [OrderStatus.SERVING]: 'Đang thực hiện',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  [OrderStatus.PENDING]: 'bg-amber-100 text-amber-800 border-amber-200',
  [OrderStatus.PREPARING]: 'bg-sky-100 text-sky-800 border-sky-200',
  [OrderStatus.READY]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [OrderStatus.COMPLETED]: 'bg-stone-100 text-stone-700 border-stone-200',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-700 border-red-200',
  [OrderStatus.CONFIRMED]: 'bg-amber-100 text-amber-800 border-amber-200',
  [OrderStatus.SERVING]: 'bg-sky-100 text-sky-800 border-sky-200',
};

export function normalizeStatus(status: string): OrderStatus {
  if (status === OrderStatus.CONFIRMED) return OrderStatus.PENDING;
  if (status === OrderStatus.SERVING) return OrderStatus.PREPARING;
  return status as OrderStatus;
}

export function isPendingStatus(status: string): boolean {
  return normalizeStatus(status) === OrderStatus.PENDING;
}

export interface OrderLineItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  toppings: Topping[];
  price: number;
  quantity: number;
  note?: string;
  sugarPercent?: number;
  icePercent?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  items: OrderLineItem[];
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  note?: string;
  paymentMethod: string;
  dailySequence: number;
  workShift: WorkShift;
  staffId: string;
  staffName: string;
  subtotal: number;
  total: number;
  status: OrderStatus | string;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface CreateOrderPayload {
  items: OrderLineItem[];
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  note?: string;
  paymentMethod: string;
  workShift: WorkShift;
  subtotal: number;
  total: number;
  branchId?: string;
}

export interface UpdateOrderPayload {
  items?: OrderLineItem[];
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  note?: string;
  subtotal?: number;
  total?: number;
}
