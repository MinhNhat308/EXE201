'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { BRAND, BRAND_LOGO } from '@/lib/brand';
import type { SegmentOption } from '@/lib/segments';

/** Top bar thống nhất: Solo · Store POS · Staff hub */
export function DashboardTopBar({
  eyebrow,
  title,
  userName,
  maxWidth = 'max-w-3xl',
  backHref,
  actions,
  onLogout,
}: {
  eyebrow?: string;
  title?: string;
  userName?: string;
  maxWidth?: string;
  backHref?: string;
  actions?: ReactNode;
  onLogout?: () => void;
}) {
  return (
    <header className={`shrink-0 print:hidden ${BRAND.topBar}`}>
      <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 ${maxWidth}`}>
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link href={backHref} className={BRAND.btnGhost}>
              ←
            </Link>
          ) : (
            <Image
              src={BRAND_LOGO}
              alt="BOBAPOS"
              width={36}
              height={36}
              className="rounded-xl object-cover ring-1 ring-stone-200/80"
            />
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className={`truncate text-[11px] font-semibold uppercase tracking-wide ${BRAND.primaryText}`}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="truncate text-base font-bold text-stone-900 sm:text-lg">{title}</h1>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {userName && (
            <span className="hidden max-w-[9rem] truncate text-sm text-stone-500 md:inline">
              {userName}
            </span>
          )}
          {actions}
          {onLogout && (
            <button type="button" onClick={onLogout} className={BRAND.btnGhost}>
              Thoát
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppCard({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`${hover ? BRAND.cardHover : BRAND.card} ${className}`}>{children}</div>
  );
}

export function PlanCallout({
  segment,
  title,
  children,
}: {
  segment?: SegmentOption | null;
  title: string;
  children: ReactNode;
}) {
  const border = segment?.border ?? 'border-[#2F80ED]/25';
  const accent = segment?.accent ?? 'from-[#2F80ED]/8 to-white';
  return (
    <div
      className={`mb-6 rounded-2xl border bg-gradient-to-br px-5 py-4 ${border} ${accent}`}
    >
      <p className="text-sm font-semibold text-stone-900">
        {segment?.emoji ? `${segment.emoji} ` : ''}
        {title}
      </p>
      <div className="mt-1 text-sm text-stone-700/90">{children}</div>
    </div>
  );
}

export function HubStatStrip({
  loading,
  orderCount,
  revenue,
  shiftLabel,
}: {
  loading?: boolean;
  orderCount: number;
  revenue: number;
  shiftLabel?: string;
}) {
  return (
    <div className={BRAND.statStrip}>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        Hôm nay{shiftLabel ? ` · ${shiftLabel}` : ''}
      </p>
      <div className="mt-2 flex flex-wrap gap-6">
        <div>
          <p className="text-2xl font-bold tabular-nums text-stone-900">
            {loading ? '—' : orderCount}
          </p>
          <p className="text-xs text-stone-500">đơn (chưa hủy)</p>
        </div>
        <div>
          <p className={`text-2xl font-bold tabular-nums ${BRAND.primaryText}`}>
            {loading ? '—' : new Intl.NumberFormat('vi-VN').format(revenue)}
          </p>
          <p className="text-xs text-stone-500">đã hoàn tất (đ)</p>
        </div>
      </div>
    </div>
  );
}

export function HubActionCard({
  href,
  emoji,
  title,
  description,
  accent,
}: {
  href: string;
  emoji: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`group block border p-6 shadow-sm transition hover:shadow-lg ${accent} rounded-2xl`}
    >
      <span className="text-3xl">{emoji}</span>
      <h2 className="mt-3 text-lg font-bold text-stone-900 group-hover:text-[#2F80ED]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </Link>
  );
}

export function PageLoading() {
  return (
    <div className={`flex min-h-screen items-center justify-center ${BRAND.pageBg}`}>
      <div className={`h-11 w-11 animate-spin rounded-full border-4 ${BRAND.spinner}`} />
    </div>
  );
}
