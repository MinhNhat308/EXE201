'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { StockItem, WarehouseLocation } from '@/models/inventory.model';
import {
  CATEGORY_ORDER,
  INGREDIENT_CATEGORY_LABELS,
  IngredientCategory,
} from '@/models/ingredient-category.model';

import { BRAND } from '@/lib/brand';

/** Giữ alias — toàn bộ dùng palette xanh dương POS */
export type InventoryTheme = 'warehouse' | 'accounting';

const POS = {
  gradient: BRAND.headerGradient,
  ring: BRAND.primaryRing,
  btn: BRAND.primary,
  btnSoft: BRAND.primarySoft,
  pillActive: 'bg-[#2F80ED] text-white shadow-md shadow-[#2F80ED]/25',
  link: 'hover:border-[#2F80ED]/40 hover:text-[#2F80ED]',
  bar: 'bg-[#2F80ED]',
};

const THEME = {
  warehouse: POS,
  accounting: POS,
} as const;

export function categoryIcon(cat: IngredientCategory): string {
  switch (cat) {
    case IngredientCategory.LIQUID:
      return '💧';
    case IngredientCategory.DRY:
      return '🌾';
    case IngredientCategory.TOPPING:
      return '🧋';
    default:
      return '📦';
  }
}

export function categoryAccent(cat: IngredientCategory): string {
  switch (cat) {
    case IngredientCategory.LIQUID:
      return 'border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50';
    case IngredientCategory.DRY:
      return 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50';
    case IngredientCategory.TOPPING:
      return 'border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50';
    default:
      return 'border-stone-200 bg-gradient-to-br from-stone-50 to-slate-50';
  }
}

export function stockFillPercent(item: StockItem): number {
  if (item.displayMinStock <= 0) return item.isLow ? 35 : 85;
  const ratio = item.displayStock / Math.max(item.displayMinStock, 1);
  return Math.min(100, Math.max(8, Math.round(ratio * 40)));
}

export function InventoryPageHeader({
  theme,
  title,
  subtitle,
  badge,
  children,
}: {
  theme: InventoryTheme;
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
}) {
  const t = THEME[theme];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${t.gradient} p-6 text-white shadow-lg`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-white/5" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          {badge && (
            <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider">
              {badge}
            </span>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-white/85">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: string;
  tone?: 'default' | 'warning' | 'info' | 'success';
}) {
  const tones = {
    default: 'border-stone-200/80 bg-white',
    warning: 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50',
    info: 'border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50',
    success: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50',
  };
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-stone-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function WarehouseSelector({
  warehouses,
  selectedId,
  onSelect,
  theme,
}: {
  warehouses: WarehouseLocation[];
  selectedId: string;
  onSelect: (id: string) => void;
  theme: InventoryTheme;
}) {
  const t = THEME[theme];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {warehouses.map((w) => {
        const active = selectedId === w.id;
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelect(w.id)}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              active
                ? `border-transparent bg-gradient-to-br ${t.gradient} text-white shadow-lg ${t.ring} ring-4`
                : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{w.isCentralWarehouse ? '🏭' : w.isKitchenSource ? '👨‍🍳' : '🏬'}</span>
              <span className="font-bold">{w.code}</span>
            </div>
            <p className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-stone-500'}`}>
              {w.name}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function IngredientStockCard({ item }: { item: StockItem }) {
  const fill = stockFillPercent(item);
  const accent = categoryAccent(item.category ?? IngredientCategory.OTHER);
  return (
    <div
      className={`rounded-2xl border-2 p-4 shadow-sm transition hover:shadow-md ${accent} ${
        item.isLow ? 'ring-2 ring-amber-400/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-lg" aria-hidden>
            {categoryIcon(item.category ?? IngredientCategory.OTHER)}
          </span>
          <h3 className="mt-1 truncate font-semibold text-stone-900">{item.name}</h3>
          <p className="text-xs text-stone-500">
            {INGREDIENT_CATEGORY_LABELS[item.category ?? IngredientCategory.OTHER]}
          </p>
        </div>
        {item.isLow ? (
          <span className="shrink-0 rounded-full bg-[#2F80ED] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Sắp hết
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Ổn
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-stone-900">
        {item.displayStock}{' '}
        <span className="text-base font-medium text-stone-600">{item.displayUnit}</span>
      </p>
      <p className="mt-0.5 text-xs text-stone-500">
        Tối thiểu: {item.displayMinStock} {item.displayUnit}
      </p>
      {item.nearestExpiry && (
        <p className="mt-1 text-xs font-medium text-amber-800">
          HSD gần nhất:{' '}
          {new Date(item.nearestExpiry).toLocaleDateString('vi-VN')}
          {item.expiringQty != null && item.expiringQty > 0
            ? ` · ${item.expiringQty.toLocaleString('vi-VN')} ${item.displayUnit}`
            : ''}
        </p>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200/80">
        <div
          className={`h-full rounded-full transition-all ${
            item.isLow ? 'bg-[#2F80ED]' : 'bg-blue-500'
          }`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}

export function StockCardGrid({ items }: { items: StockItem[] }) {
  const grouped = new Map<IngredientCategory, StockItem[]>();
  for (const cat of CATEGORY_ORDER) grouped.set(cat, []);
  for (const item of items) {
    const cat = item.category ?? IngredientCategory.OTHER;
    grouped.get(cat)?.push(item);
  }

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((cat) => {
        const rows = grouped.get(cat) ?? [];
        if (!rows.length) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-600">
              <span>{categoryIcon(cat)}</span>
              {INGREDIENT_CATEGORY_LABELS[cat]}
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal normal-case text-stone-500">
                {rows.length} mặt hàng
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {rows.map((row) => (
                <IngredientStockCard key={row.id} item={row} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ModuleCard({
  href,
  title,
  desc,
  icon,
  theme,
  stat,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
  theme: InventoryTheme;
  stat?: string;
}) {
  const t = THEME[theme];
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-lg ${t.link}`}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-2xl transition group-hover:scale-110">
          {icon}
        </span>
        {stat && (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            {stat}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-bold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-500">{desc}</p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-stone-400 group-hover:text-stone-700">
        Mở →
      </span>
    </Link>
  );
}

export function WorkflowSteps({ theme }: { theme: InventoryTheme }) {
  const steps =
    theme === 'warehouse'
      ? [
          { n: '1', t: 'Kế toán nhập NCC', d: 'Vào KHO_TONG' },
          { n: '2', t: 'Đầu ca: cấp phát', d: 'PXK + chứng từ' },
          { n: '3', t: 'Kế toán duyệt', d: 'Kho con nhận hàng' },
          { n: '4', t: 'Bàn giao ca sau', d: 'Tồn dư giữ tại kho con' },
        ]
      : [
          { n: '1', t: 'Nhập NCC', d: 'Hóa đơn → KHO_TONG' },
          { n: '2', t: 'Duyệt phiếu', d: 'Xin nhập/xuất' },
          { n: '3', t: 'Đối chiếu tồn', d: 'Theo từng kho' },
          { n: '4', t: 'Sao kê tháng', d: 'Chứng từ đầy đủ' },
        ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => (
        <div
          key={s.n}
          className="flex gap-3 rounded-xl border border-stone-200/80 bg-white/80 p-3 backdrop-blur-sm"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-sm font-bold text-white">
            {s.n}
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-800">{s.t}</p>
            <p className="text-xs text-stone-500">{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 px-8 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-3 font-semibold text-stone-700">{title}</p>
      {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
    </div>
  );
}

export function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-stone-200/60" />
      ))}
    </div>
  );
}

export { THEME, POS as POS_THEME };
