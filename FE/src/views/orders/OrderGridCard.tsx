'use client';

import { formatCurrency, formatDateTime } from '@/lib/format';
import { Order } from '@/models/order.model';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderGridCardProps {
  order: Order;
  onClick: () => void;
  selected?: boolean;
}

export function OrderGridCard({ order, onClick, selected }: OrderGridCardProps) {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
        selected
          ? 'border-[#2F80ED] ring-2 ring-amber-200'
          : 'border-stone-100 hover:border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-lg font-bold text-stone-900">
            #{order.orderNumber}
          </p>
          <p className="text-xs text-stone-400">HĐ {order.invoiceNumber}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-stone-600">
        <p>
          <span className="text-stone-400">Bàn:</span>{' '}
          <span className="font-medium">{order.tableNumber ?? '—'}</span>
        </p>
        {order.customerName && (
          <p>
            <span className="text-stone-400">Khách:</span> {order.customerName}
          </p>
        )}
        <p className="text-xs text-stone-400">{formatDateTime(order.createdAt)}</p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-xs text-stone-500">{itemCount} món</span>
        <span className="font-bold text-amber-600">{formatCurrency(order.total)}</span>
      </div>
    </button>
  );
}
