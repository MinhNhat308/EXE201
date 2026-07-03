'use client';

import { formatToppingsLabel } from '@/lib/cart';
import { formatCurrency } from '@/lib/format';
import { formatSugarIceLine } from '@/lib/sugar-ice';
import { Order } from '@/models/order.model';

export function OrderBillDetail({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-stone-50 p-4 text-sm">
        <p>
          <span className="text-stone-400">Mã HĐ:</span>{' '}
          <span className="font-mono font-semibold">{order.invoiceNumber}</span>
        </p>
        <p className="mt-1">
          <span className="text-stone-400">Đơn:</span> #{order.orderNumber} · Bàn{' '}
          {order.tableNumber}
        </p>
        {order.customerName && (
          <p className="mt-1">
            <span className="text-stone-400">Khách:</span> {order.customerName}
            {order.customerPhone && ` · ${order.customerPhone}`}
          </p>
        )}
        {order.note && (
          <p className="mt-1 text-amber-700">📝 {order.note}</p>
        )}
        <p className="mt-1">
          <span className="text-stone-400">TT:</span> {order.paymentMethod}
        </p>
        {order.cancelReason && (
          <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-red-700">
            Lý do hủy: {order.cancelReason}
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {order.items.map((item, idx) => (
          <li
            key={idx}
            className="flex justify-between gap-2 rounded-lg border border-stone-100 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">
                {item.quantity}x {item.name}
              </p>
              {item.toppings?.length > 0 && (
                <p className="text-xs text-violet-600">
                  + {formatToppingsLabel(item.toppings)}
                </p>
              )}
              {(item.sugarPercent != null || item.icePercent != null) && (
                <p className="text-xs font-medium text-emerald-700">
                  {formatSugarIceLine(item.sugarPercent, item.icePercent)}
                </p>
              )}
              {item.note?.trim() && (
                <p className="text-xs text-amber-700">📝 {item.note}</p>
              )}
            </div>
            <p className="shrink-0 font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
        <span>Tổng</span>
        <span className="text-amber-600">{formatCurrency(order.total)}</span>
      </div>
    </div>
  );
}
