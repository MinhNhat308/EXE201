'use client';

import { useEffect, useMemo, useState } from 'react';
import { BRAND } from '@/lib/brand';
import { formatCurrency } from '@/lib/format';
import { formatToppingsLabel } from '@/lib/cart';
import { formatSugarIceLine } from '@/lib/sugar-ice';
import { CartItem, MenuItem } from '@/models/menu.model';
import { MenuProductImage } from '@/views/components/MenuProductImage';
import { CardGridSkeleton } from '@/views/components/Skeleton';

const CATEGORY_EMOJI: Record<string, string> = {
  'Trà sữa': '🥛',
  'Trà trái cây': '🍑',
  'Kem cheese': '🧀',
  Cacao: '🍫',
  'Cà phê': '☕',
};

interface CashierMenuStepProps {
  menuItems: MenuItem[];
  loadingMenu: boolean;
  cart: CartItem[];
  subtotal: number;
  onSelectItem: (item: MenuItem) => void;
  onUpdateQty: (cartLineId: string, delta: number) => void;
  onContinue: () => void;
}

export function CashierMenuStep({
  menuItems,
  loadingMenu,
  cart,
  subtotal,
  onSelectItem,
  onUpdateQty,
  onContinue,
}: CashierMenuStepProps) {
  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map((i) => i.category))];
    return cats.sort();
  }, [menuItems]);

  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [menuItems, activeCategory],
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const qtyByMenuItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart) {
      map.set(line.menuItemId, (map.get(line.menuItemId) ?? 0) + line.quantity);
    }
    return map;
  }, [cart]);

  const qtyInCartForItem = (menuItemId: string) => qtyByMenuItem.get(menuItemId) ?? 0;

  return (
    <div className="grid h-[calc(100dvh-9.5rem)] grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3.5fr)_minmax(17rem,0.5fr)]">
      <section className="flex min-h-0 overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-sm">
        <aside className="flex w-44 shrink-0 flex-col border-r border-blue-100 bg-blue-50/60">
          <div className="border-b border-blue-100 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
              Danh mục
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {loadingMenu ? (
              <p className="px-2 py-3 text-xs text-stone-400">Đang tải...</p>
            ) : (
              categories.map((category) => {
                const count = menuItems.filter((i) => i.category === category).length;
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? 'bg-blue-600 font-semibold text-white shadow-md shadow-blue-200'
                        : 'text-stone-700 hover:bg-blue-100'
                    }`}
                  >
                    <span className="text-lg">{CATEGORY_EMOJI[category] ?? '🧋'}</span>
                    <span className="min-w-0 flex-1 leading-tight">{category}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-blue-200/80 text-blue-900'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
                <span>{CATEGORY_EMOJI[activeCategory] ?? '🧋'}</span>
                {activeCategory || 'Menu'}
              </h2>
              <p className="text-xs text-stone-500">
                {filteredItems.length} món · Chọn để thêm topping
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingMenu ? (
              <CardGridSkeleton count={6} />
            ) : filteredItems.length === 0 ? (
              <div className="flex h-full items-center justify-center text-stone-400">
                Không có món trong danh mục này
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredItems.map((item) => {
                  const qty = qtyInCartForItem(item.id);
                  const hasToppings = (item.toppings?.length ?? 0) > 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition hover:shadow-lg ${
                        qty > 0
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-stone-100 hover:border-blue-300'
                      }`}
                    >
                      {qty > 0 && (
                        <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow">
                          {qty}
                        </span>
                      )}
                      {hasToppings && (
                        <span className="absolute left-2 top-2 z-10 rounded-md bg-blue-900/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                          + topping
                        </span>
                      )}
                      <div className="relative aspect-[4/3] w-full bg-blue-50">
                        <MenuProductImage
                          name={item.name}
                          imageUrl={item.imageUrl}
                          sizes="200px"
                        />
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-800">
                          {item.name}
                        </p>
                        <p className="mt-2 text-base font-bold text-blue-600">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-blue-900/30 bg-gradient-to-b from-slate-900 to-blue-950 text-white shadow-lg">
        <div className="border-b border-stone-700 bg-stone-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                Hóa đơn tạm
              </p>
              <h3 className="text-lg font-bold">Bill</h3>
            </div>
            <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-bold text-white">
              {cartCount}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-stone-500">
              <p className="text-4xl opacity-40">🧾</p>
              <p className="mt-3 text-sm">Chưa có món</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.map((item, index) => (
                <li
                  key={item.cartLineId}
                  className="rounded-xl bg-stone-800/80 p-3 ring-1 ring-stone-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-medium text-blue-300">
                        #{index + 1}
                      </span>
                      <p className="font-medium leading-snug">{item.name}</p>
                      {item.toppings.length > 0 ? (
                        <p className="mt-0.5 text-[11px] text-blue-200">
                          + {formatToppingsLabel(item.toppings)}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-stone-500">Không topping</p>
                      )}
                      {(item.sugarPercent != null &&
                        (item.sugarPercent !== 100 || item.icePercent !== 100)) && (
                        <p className="mt-0.5 text-[11px] text-sky-300">
                          {formatSugarIceLine(item.sugarPercent, item.icePercent)}
                        </p>
                      )}
                      <p className="text-xs text-stone-400">
                        {formatCurrency(item.price)} / ly
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-blue-300">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg bg-stone-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartLineId, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-600"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartLineId, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-600"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.cartLineId, -item.quantity)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-stone-700 bg-stone-800 p-4">
          <div className="mb-4 flex justify-between text-xl font-bold">
            <span>Tổng</span>
            <span className="text-blue-300">{formatCurrency(subtotal)}</span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={cart.length === 0}
            className={`w-full rounded-xl py-3.5 text-base font-bold text-white disabled:opacity-40 ${BRAND.primary}`}
          >
            Tiếp tục thanh toán →
          </button>
        </div>
      </aside>
    </div>
  );
}
