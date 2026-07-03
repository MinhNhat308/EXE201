'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND, BRAND_COVER, MARKETING, MENU_IMAGE_BY_NAME } from '@/lib/brand';

const PERKS = [
  { text: 'POS, bếp KDS, kho & kế toán', color: 'bg-sky-100 text-sky-700' },
  { text: 'Solo · Store · Chain', color: 'bg-violet-100 text-violet-700' },
  { text: 'Đồng bộ realtime', color: 'bg-emerald-100 text-emerald-700' },
  { text: 'Trial Premium 7 ngày', color: 'bg-rose-100 text-rose-600' },
];

export function AuthMarketingLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-h-screen ${MARKETING.pageBg}`}>
      <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
        {/* Panel trái — đa màu */}
        <aside
          className={`relative hidden overflow-hidden lg:flex lg:flex-col ${MARKETING.heroBg}`}
        >
          <div className="pointer-events-none absolute inset-0 landing-hero-mesh" />
          <div className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-[#FF8E53]/30 blur-3xl landing-glow-ring" />
          <div className="pointer-events-none absolute bottom-20 right-0 h-56 w-56 rounded-full bg-[#8B5CF6]/25 blur-3xl" />

          <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-12">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
              >
                <BrandLogo size={24} showName={false} />
                <span>← Trang chủ</span>
              </Link>

              <h1 className="mt-10 text-3xl font-extrabold leading-tight text-stone-900 xl:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-600">{subtitle}</p>

              <div className="mt-8 flex flex-wrap gap-2">
                {PERKS.map((p) => (
                  <span
                    key={p.text}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${p.color}`}
                  >
                    {p.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mt-10">
              <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-[#FF8E53]/25 via-[#8B5CF6]/20 to-[#2F80ED]/25 blur-xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-white bg-white shadow-2xl shadow-violet-200/60">
                <div className="relative aspect-[16/10]">
                  <Image src={BRAND_COVER} alt="" fill className="object-cover" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-sky-50 via-white to-violet-50 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-600">POS · Bếp · Kho realtime</p>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Live
                  </span>
                </div>
              </div>

              <div className="landing-float absolute -right-4 -top-6 w-28 overflow-hidden rounded-2xl border-2 border-amber-100 bg-white p-2 shadow-lg shadow-amber-100/80">
                <div className="relative h-14 overflow-hidden rounded-xl">
                  <Image
                    src={MENU_IMAGE_BY_NAME['Trà sữa matcha']}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-1 truncate text-[10px] font-bold text-stone-800">Matcha</p>
                <p className="text-[9px] font-semibold text-[#FF6B6B]">38k</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Form */}
        <main className="relative flex flex-col">
          <div className="pointer-events-none absolute inset-0 landing-hero-mesh opacity-40 lg:opacity-20" />

          <div className="relative p-6 lg:p-8">
            <Link href="/" className={`font-bold lg:hidden ${BRAND.primaryText}`}>
              ← BOBAPOS
            </Link>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-10 sm:px-8">
            <div className="w-full max-w-[440px]">
              <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl shadow-violet-100/60 backdrop-blur-sm sm:p-10">
                <div className="mb-6 lg:hidden">
                  <BrandLogo size={40} showName />
                </div>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
