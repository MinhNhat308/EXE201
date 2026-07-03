import { normalizeStatus, Order, OrderStatus } from '@/models/order.model';

export type KitchenSortMode = 'fifo' | 'takeaway-first';

export function isTakeAwayOrder(tableNumber?: string | null): boolean {
  if (!tableNumber?.trim()) return true;
  const t = tableNumber.toLowerCase();
  return (
    t.includes('mang') ||
    t.includes('take') ||
    t.includes('đi') ||
    t.includes('di') ||
    t.includes('grab') ||
    t.includes('ship')
  );
}

export function orderElapsedMinutes(createdAt: string, now = Date.now()): number {
  const ms = now - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / 60_000));
}

export function formatWaitLabel(minutes: number): string {
  if (minutes < 1) return 'Vừa vào';
  if (minutes === 1) return '1 phút';
  return `${minutes} phút trước`;
}

export function waitUrgencyClass(minutes: number): string {
  if (minutes >= 15) return 'bg-red-100 text-red-800 ring-red-200';
  if (minutes >= 10) return 'bg-orange-100 text-orange-800 ring-orange-200';
  if (minutes >= 5) return 'bg-amber-100 text-amber-800 ring-amber-200';
  return 'bg-stone-100 text-stone-600 ring-stone-200';
}

export function tableBadge(tableNumber?: string | null): {
  label: string;
  className: string;
} {
  if (isTakeAwayOrder(tableNumber)) {
    return {
      label: tableNumber?.trim() || 'Mang đi',
      className: 'bg-violet-100 text-violet-800 ring-violet-200',
    };
  }
  return {
    label: tableNumber ?? '—',
    className: 'bg-sky-100 text-sky-800 ring-sky-200',
  };
}

export function sortKitchenOrders(orders: Order[], mode: KitchenSortMode): Order[] {
  return [...orders].sort((a, b) => {
    if (mode === 'takeaway-first') {
      const aTake = isTakeAwayOrder(a.tableNumber) ? 0 : 1;
      const bTake = isTakeAwayOrder(b.tableNumber) ? 0 : 1;
      if (aTake !== bTake) return aTake - bTake;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function kitchenStatusCounts(orders: Order[]) {
  const active = orders.filter(
    (o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED,
  );
  return {
    pending: active.filter((o) => normalizeStatus(o.status) === OrderStatus.PENDING)
      .length,
    preparing: active.filter(
      (o) => normalizeStatus(o.status) === OrderStatus.PREPARING,
    ).length,
    ready: active.filter((o) => normalizeStatus(o.status) === OrderStatus.READY)
      .length,
    active: active.filter((o) => {
      const s = normalizeStatus(o.status);
      return s !== OrderStatus.READY && s !== OrderStatus.COMPLETED;
    }).length,
  };
}

export function nextKitchenStatus(
  status: string,
): OrderStatus.PREPARING | OrderStatus.READY | null {
  const s = normalizeStatus(status);
  if (s === OrderStatus.PENDING) return OrderStatus.PREPARING;
  if (s === OrderStatus.PREPARING) return OrderStatus.READY;
  return null;
}

export function advanceKitchenLabel(status: string): string | null {
  const next = nextKitchenStatus(status);
  if (next === OrderStatus.PREPARING) return 'Bắt đầu làm';
  if (next === OrderStatus.READY) return 'Xong — sẵn sàng bưng';
  return null;
}
