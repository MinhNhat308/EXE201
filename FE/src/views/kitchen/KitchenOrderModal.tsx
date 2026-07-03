'use client';

import { ReactNode } from 'react';
import { formatCurrency } from '@/lib/format';
import {
  advanceKitchenLabel,
  formatWaitLabel,
  orderElapsedMinutes,
  tableBadge,
} from '@/lib/kitchen-order-utils';
import { Order } from '@/models/order.model';
import { OrderStatusBadge } from '@/views/orders/OrderStatusBadge';
import { KitchenLineItems } from './KitchenLineItems';

export function KitchenOrderModal({
  order,
  open,
  updating,
  onClose,
  onAdvance,
}: {
  order: Order | null;
  open: boolean;
  updating: boolean;
  onClose: () => void;
  onAdvance: () => void;
}) {
  if (!open || !order) return null;

  const badge = tableBadge(order.tableNumber);
  const waitMin = orderElapsedMinutes(order.createdAt);
  const actionLabel = advanceKitchenLabel(order.status);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xl font-bold">#{order.orderNumber}</p>
            <p className="text-sm text-stone-500">HĐ {order.invoiceNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${badge.className}`}>
            {badge.label}
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">
            ⏱ {formatWaitLabel(waitMin)}
          </span>
        </div>

        {order.customerName && (
          <p className="mt-2 text-sm text-stone-600">
            Khách: <strong>{order.customerName}</strong>
            {order.customerPhone ? ` · ${order.customerPhone}` : ''}
          </p>
        )}

        {order.note?.trim() && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            📝 {order.note}
          </p>
        )}

        <div className="mt-4">
          <KitchenLineItems items={order.items} large />
        </div>

        <p className="mt-4 text-right text-xl font-bold text-amber-700">
          {formatCurrency(order.total)}
        </p>

        {actionLabel && (
          <button
            type="button"
            disabled={updating}
            onClick={onAdvance}
            className="mt-4 w-full rounded-xl bg-[#2F80ED] py-3.5 text-base font-bold text-white disabled:opacity-60"
          >
            {updating ? 'Đang cập nhật…' : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function KitchenToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[110] -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg ring-1 ring-emerald-100">
        <p className="text-sm font-semibold text-emerald-900">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export function KitchenKdsToolbar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  );
}
