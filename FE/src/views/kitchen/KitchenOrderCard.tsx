'use client';

import { formatCurrency } from '@/lib/format';
import { formatSugarIceLine } from '@/lib/sugar-ice';
import {
  advanceKitchenLabel,
  formatWaitLabel,
  isTakeAwayOrder,
  orderElapsedMinutes,
  tableBadge,
  waitUrgencyClass,
} from '@/lib/kitchen-order-utils';
import { Order } from '@/models/order.model';
import { OrderStatusBadge } from '@/views/orders/OrderStatusBadge';
import { KitchenLineItems } from './KitchenLineItems';

export type KitchenCardDensity = 'compact' | 'comfortable';

export function KitchenOrderCard({
  order,
  density = 'comfortable',
  kdsMode = false,
  updating,
  onAdvance,
  onOpen,
}: {
  order: Order;
  density?: KitchenCardDensity;
  kdsMode?: boolean;
  updating?: boolean;
  onAdvance: () => void;
  onOpen: () => void;
}) {
  const compact = density === 'compact';
  const waitMin = orderElapsedMinutes(order.createdAt);
  const badge = tableBadge(order.tableNumber);
  const actionLabel = advanceKitchenLabel(order.status);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const itemSummary = order.items
    .map((i) => `${i.quantity}× ${i.name}`)
    .join(' · ');

  if (compact) {
    return (
      <article
        className={`rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
          waitMin >= 10 ? 'border-orange-300 ring-1 ring-orange-200' : 'border-stone-200'
        }`}
      >
        <button
          type="button"
          onClick={onOpen}
          className="w-full px-3 py-2 text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-sm font-bold text-stone-900">
              #{order.orderNumber.replace('STORE-DEMO-', '')}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${waitUrgencyClass(waitMin)}`}
            >
              {formatWaitLabel(waitMin)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className={`rounded px-1.5 py-0.5 font-semibold ${badge.className}`}>
              {isTakeAwayOrder(order.tableNumber) ? '🥤' : '🪑'} {badge.label}
            </span>
            <span className="text-stone-500">{itemCount} món</span>
            <span className="font-semibold text-amber-700">{formatCurrency(order.total)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-stone-500">
            {itemSummary}
          </p>
          {order.items.some(
            (i) => i.sugarPercent != null || i.icePercent != null || i.note,
          ) && (
            <p className="mt-0.5 truncate text-[10px] font-medium text-emerald-700">
              {order.items
                .filter((i) => i.sugarPercent != null || i.icePercent != null)
                .slice(0, 1)
                .map((i) => formatSugarIceLine(i.sugarPercent, i.icePercent))
                .join('')}
            </p>
          )}
        </button>
        {actionLabel && (
          <div className="border-t border-stone-100 px-2 pb-2 pt-1.5">
            <button
              type="button"
              disabled={updating}
              onClick={(e) => {
                e.stopPropagation();
                onAdvance();
              }}
              className="w-full rounded-lg bg-[#2F80ED] py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {updating ? '…' : actionLabel}
            </button>
          </div>
        )}
      </article>
    );
  }

  const previewItems = order.items.slice(0, kdsMode ? 3 : 2);

  return (
    <article
      className={`flex flex-col rounded-2xl border-2 bg-white shadow-sm transition hover:shadow-md ${
        kdsMode ? 'border-stone-200 p-4' : 'border-stone-100 p-3'
      } ${waitMin >= 10 ? 'ring-2 ring-orange-200' : ''}`}
    >
      <button type="button" onClick={onOpen} className="text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-mono font-bold text-stone-900 ${kdsMode ? 'text-xl' : 'text-lg'}`}>
              #{order.orderNumber}
            </p>
            <p className="text-xs text-stone-400">HĐ {order.invoiceNumber}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${badge.className}`}
          >
            {isTakeAwayOrder(order.tableNumber) ? '🥤 ' : '🪑 '}
            {badge.label}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${waitUrgencyClass(waitMin)}`}
          >
            ⏱ {formatWaitLabel(waitMin)}
          </span>
        </div>

        {order.note?.trim() && (
          <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
            📝 {order.note}
          </p>
        )}

        <div className="mt-3">
          <KitchenLineItems items={previewItems} large={kdsMode} />
          {order.items.length > previewItems.length && (
            <p className="mt-1 text-xs text-stone-400">
              +{order.items.length - previewItems.length} món — bấm xem chi tiết
            </p>
          )}
        </div>

        <p className={`mt-2 font-bold text-amber-700 ${kdsMode ? 'text-lg' : 'text-sm'}`}>
          {formatCurrency(order.total)}
        </p>
      </button>

      {actionLabel && (
        <button
          type="button"
          disabled={updating}
          onClick={(e) => {
            e.stopPropagation();
            onAdvance();
          }}
          className={`mt-3 w-full rounded-xl bg-[#2F80ED] font-bold text-white shadow-sm transition hover:bg-[#2563c7] disabled:opacity-60 ${
            kdsMode ? 'py-3.5 text-base' : 'py-2.5 text-sm'
          }`}
        >
          {updating ? 'Đang cập nhật…' : actionLabel}
        </button>
      )}
    </article>
  );
}
