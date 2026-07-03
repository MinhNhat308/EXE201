'use client';

import { formatToppingsLabel } from '@/lib/cart';
import { formatSugarIceLine } from '@/lib/sugar-ice';
import { OrderLineItem } from '@/models/order.model';

export function KitchenLineItems({
  items,
  large = false,
}: {
  items: OrderLineItem[];
  large?: boolean;
}) {
  const text = large ? 'text-base' : 'text-sm';
  const qty = large ? 'text-lg font-bold' : 'font-bold';

  return (
    <ul className={`space-y-2 ${text}`}>
      {items.map((item, idx) => (
        <li
          key={idx}
          className={`rounded-xl border border-stone-200 bg-white px-3 py-2.5 ${
            large ? 'px-4 py-3' : ''
          }`}
        >
          <p className={`${qty} text-stone-900`}>
            <span className="text-[#2F80ED]">{item.quantity}×</span> {item.name}
          </p>
          {(item.sugarPercent != null || item.icePercent != null) && (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              🧊 {formatSugarIceLine(item.sugarPercent, item.icePercent)}
            </p>
          )}
          {item.toppings?.length > 0 && (
            <p className="mt-0.5 text-xs font-medium text-violet-700">
              + {formatToppingsLabel(item.toppings)}
            </p>
          )}
          {item.note?.trim() && (
            <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
              📝 {item.note}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
