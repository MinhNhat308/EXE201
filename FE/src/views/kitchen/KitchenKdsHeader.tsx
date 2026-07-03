'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { BRAND, BRAND_LOGO } from '@/lib/brand';
import { WORK_SHIFT_LABELS, WorkShift } from '@/models/staff.model';

export type KitchenCardDensity = 'compact' | 'comfortable';

export function KitchenKdsHeader({
  workShift,
  counts,
  lastSyncLabel,
  sortMode,
  density,
  kdsMode,
  onRefresh,
  onToggleSort,
  onToggleDensity,
  onToggleKds,
  onExitKds,
}: {
  workShift?: WorkShift;
  counts: { pending: number; preparing: number; ready: number; active: number };
  lastSyncLabel: string;
  sortMode: 'fifo' | 'takeaway-first';
  density: KitchenCardDensity;
  kdsMode: boolean;
  onRefresh: () => void;
  onToggleSort: () => void;
  onToggleDensity: () => void;
  onToggleKds: () => void;
  onExitKds?: () => void;
}) {
  return (
    <header
      className={`shrink-0 border-b border-stone-200 bg-white ${
        kdsMode ? 'px-4 py-3' : 'rounded-xl border mb-4 px-5 py-4'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {kdsMode && (
            <Image
              src={BRAND_LOGO}
              alt="BOBAPOS"
              width={40}
              height={40}
              className="rounded-xl ring-1 ring-stone-200"
            />
          )}
          <div>
            <h1 className={`font-bold text-stone-900 ${kdsMode ? 'text-2xl' : 'text-xl'}`}>
              KDS Bếp
            </h1>
            <p className="text-sm text-stone-500">
              {workShift ? `Ca ${WORK_SHIFT_LABELS[workShift]}` : 'Tất cả ca'}
              <span className="mx-2 text-stone-300">·</span>
              {lastSyncLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <StatPill label="Chưa làm" value={counts.pending} className="bg-amber-100 text-amber-900" />
              <StatPill label="Đang làm" value={counts.preparing} className="bg-sky-100 text-sky-900" />
              <StatPill label="Sẵn bưng" value={counts.ready} className="bg-emerald-100 text-emerald-900" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
          >
            🔄 Làm mới
          </button>
          <button
            type="button"
            onClick={onToggleSort}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
            title="Thứ tự ưu tiên"
          >
            {sortMode === 'fifo' ? '📋 Cũ trước' : '🥤 Mang đi trước'}
          </button>
          <button
            type="button"
            onClick={onToggleDensity}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
            title="Mật độ hiển thị thẻ đơn"
          >
            {density === 'compact' ? '▦ Gọn' : '▣ Chi tiết'}
          </button>
          <button
            type="button"
            onClick={onToggleKds}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white ${BRAND.primary}`}
          >
            {kdsMode ? '📱 Thoát KDS' : '🖥 Toàn màn hình'}
          </button>
          {kdsMode && onExitKds && (
            <Link
              href="/dashboard/kitchen"
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm hover:bg-stone-50"
            >
              Tổng quan
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${className}`}>
      {label}
      <span className="rounded-full bg-white/70 px-1.5 text-[11px]">{value}</span>
    </span>
  );
}

export function KitchenKdsFullscreenShell({
  children,
  header,
}: {
  children: ReactNode;
  header: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-100">
      {header}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">{children}</main>
    </div>
  );
}
