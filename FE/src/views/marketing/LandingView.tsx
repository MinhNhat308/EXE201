'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND, BRAND_COVER, MARKETING, MENU_IMAGE_BY_NAME } from '@/lib/brand';
import { SEGMENTS } from '@/lib/segments';
import { MarketingShell } from './MarketingShell';
import { TrialPaymentExplainer } from './TrialPaymentExplainer';

const HERO_DRINKS = [
  { name: 'Trà sữa matcha', price: '38.000đ', img: MENU_IMAGE_BY_NAME['Trà sữa matcha'] },
  {
    name: 'Trà sữa trân châu đường đen',
    price: '42.000đ',
    img: MENU_IMAGE_BY_NAME['Trà sữa trân châu đường đen'],
  },
];

const STATS = [
  { value: '7 ngày', label: 'Trial Premium', color: 'text-[#FF6B6B]', bg: 'bg-[#FFF0ED] border-[#FFC9C0]' },
  { value: '6 vai trò', label: 'Phân quyền rõ', color: 'text-[#8B5CF6]', bg: 'bg-[#F3EEFF] border-violet-200' },
  { value: 'Realtime', label: 'POS ↔ Bếp ↔ Kho', color: 'text-[#10B981]', bg: 'bg-[#ECFDF5] border-emerald-200' },
  { value: 'SaaS', label: 'Multi-tenant', color: 'text-[#2F80ED]', bg: 'bg-[#EFF6FF] border-sky-200' },
];

const FEATURES = [
  {
    title: 'POS & Thu ngân',
    desc: 'Ca làm việc, thu ngân / phục vụ, in hóa đơn, đồng bộ bếp tức thì.',
    icon: 'pos',
    span: 'lg:col-span-2',
    iconBg: 'bg-sky-100 text-[#2F80ED]',
    cardBorder: 'border-sky-100 hover:border-sky-300',
    wash: 'from-sky-50',
  },
  {
    title: 'Bếp (KDS)',
    desc: 'PENDING → PREPARING → READY, trừ nguyên liệu theo công thức.',
    icon: 'kitchen',
    span: '',
    iconBg: 'bg-amber-100 text-amber-600',
    cardBorder: 'border-amber-100 hover:border-amber-300',
    wash: 'from-amber-50',
  },
  {
    title: 'Quản lý kho',
    desc: 'Cấp phát ca, hoàn trả, nhập NCC, duyệt phiếu điều chuyển.',
    icon: 'warehouse',
    span: '',
    iconBg: 'bg-emerald-100 text-emerald-600',
    cardBorder: 'border-emerald-100 hover:border-emerald-300',
    wash: 'from-emerald-50',
  },
  {
    title: 'Kế toán',
    desc: 'Sao kê tháng, phiếu NCC, đối chiếu cấp — hoàn — tiêu hao.',
    icon: 'accounting',
    span: '',
    iconBg: 'bg-violet-100 text-violet-600',
    cardBorder: 'border-violet-100 hover:border-violet-300',
    wash: 'from-violet-50',
  },
  {
    title: 'Báo cáo & chuỗi',
    desc: 'Doanh thu theo ca, tồn thấp, tổng hợp đa chi nhánh cho Chain.',
    icon: 'chart',
    span: 'lg:col-span-2',
    iconBg: 'bg-rose-100 text-rose-500',
    cardBorder: 'border-rose-100 hover:border-rose-300',
    wash: 'from-rose-50',
  },
];

const ROLE_PILLS = [
  { label: 'Chủ quán', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  { label: 'Thu ngân', className: 'border-[#FFC9C0] bg-[#FFF0ED] text-[#E85D4A]' },
  { label: 'Bếp', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  { label: 'Kho', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { label: 'Kế toán', className: 'border-violet-200 bg-violet-50 text-violet-800' },
  { label: 'Quản lý ca', className: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800' },
  { label: 'Phục vụ', className: 'border-teal-200 bg-teal-50 text-teal-800' },
  { label: 'Admin SaaS', className: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
];

const STEPS = [
  {
    n: '01',
    title: 'Chọn gói phù hợp',
    desc: 'Solo · Store · Chain — đăng ký trial 7 ngày, đủ tính năng Premium.',
    badge: 'from-[#2F80ED] to-sky-400',
    shadow: 'shadow-sky-200',
  },
  {
    n: '02',
    title: 'Thiết lập & nhân sự',
    desc: 'Menu mẫu, kho mẫu sẵn có. Thêm NV bằng username + mã cửa hàng.',
    badge: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-200',
  },
  {
    n: '03',
    title: 'Vận hành mỗi ngày',
    desc: 'Bán hàng, duyệt kho, theo dõi doanh thu ca — mọi màn hình đồng bộ.',
    badge: 'from-violet-500 to-fuchsia-400',
    shadow: 'shadow-violet-200',
  },
];

const PLAN_BTN: Record<string, string> = {
  solo: 'bg-gradient-to-r from-[#2F80ED] to-sky-500 text-white shadow-sky-200/50 hover:shadow-lg',
  store:
    'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200/50 hover:shadow-lg',
  chain:
    'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-violet-200/50 hover:shadow-lg',
};

function FeatureIcon({ type }: { type: string }) {
  const cls = 'h-6 w-6';
  switch (type) {
    case 'pos':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      );
    case 'kitchen':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 001-6-.37V7.5m16 0A48.655 48.655 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m0 0 .5 8.25M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
        </svg>
      );
    case 'warehouse':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case 'accounting':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
  }
}

export function LandingView() {
  return (
    <MarketingShell active="home">
      {/* ── Hero ── */}
      <section className={`relative overflow-hidden ${MARKETING.heroBg}`}>
        <div className="pointer-events-none absolute inset-0 landing-hero-mesh" />
        <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-[#FF8E53]/25 blur-3xl landing-glow-ring" />
        <div className="pointer-events-none absolute right-0 top-16 h-64 w-64 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-[#10B981]/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur-sm">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-[#FF6B6B]" />
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                <span className="h-2 w-2 rounded-full bg-[#2F80ED]" />
              </span>
              SaaS cho quán trà sữa · Solo · Store · Chain
            </div>

            <h1 className="mt-8 text-4xl font-extrabold leading-[1.06] tracking-tight text-stone-900 sm:text-5xl xl:text-[3.35rem]">
              Vận hành quán
              <span className="mt-1 block landing-shimmer-text">từ quầy đến kho</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
              <strong className="font-semibold text-stone-900">BOBAPOS</strong> gộp POS, bếp KDS,
              kho và kế toán — một hệ thống, mọi vai trò. Dùng thử Premium{' '}
              <strong className="text-[#FF6B6B]">7 ngày</strong> miễn phí.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2F80ED] via-[#8B5CF6] to-[#FF8E53] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-violet-300/40 transition hover:shadow-2xl hover:shadow-violet-300/50"
              >
                <span className="relative z-10">Bắt đầu miễn phí →</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-full" />
              </Link>
              <Link
                href="/pricing"
                className="rounded-2xl border-2 border-violet-200 bg-white/80 px-8 py-4 text-sm font-bold text-violet-700 shadow-sm backdrop-blur-sm transition hover:border-violet-300 hover:bg-white"
              >
                Xem bảng giá
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl border p-3.5 shadow-sm ${s.bg}`}
                >
                  <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="landing-float-slow relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#FF8E53]/30 via-[#8B5CF6]/25 to-[#2F80ED]/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-2xl shadow-violet-200/50 ring-1 ring-violet-100">
                <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-sky-50 via-white to-violet-50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <BrandLogo size={22} showName={false} />
                    <span className="text-xs font-semibold text-stone-600">BOBAPOS Dashboard</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  </div>
                </div>
                <div className="relative aspect-[4/3]">
                  <Image src={BRAND_COVER} alt="BOBAPOS" fill className="object-cover" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Trà sữa matcha</p>
                        <p className="text-xs text-white/80">Đơn #1024 · Bếp READY</p>
                      </div>
                      <span className="rounded-full bg-emerald-400/90 px-3 py-1 text-xs font-bold text-white shadow-md">
                        +38.000đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-float absolute -left-4 top-8 z-10 hidden w-44 rounded-2xl border border-amber-100 bg-white p-3 shadow-xl shadow-amber-100/80 sm:block lg:-left-10">
              <div className="relative mb-2 h-16 overflow-hidden rounded-xl ring-2 ring-amber-100">
                <Image src={HERO_DRINKS[0].img} alt="" fill className="object-cover" />
              </div>
              <p className="truncate text-xs font-bold text-stone-800">{HERO_DRINKS[0].name}</p>
              <p className="text-[10px] font-medium text-[#FF6B6B]">{HERO_DRINKS[0].price}</p>
            </div>

            <div className="landing-float-delay absolute -right-2 bottom-16 z-10 hidden w-48 rounded-2xl border border-violet-100 bg-white p-4 shadow-xl shadow-violet-100/80 sm:block lg:-right-8">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                Doanh thu hôm nay
              </p>
              <p className="mt-1 text-xl font-extrabold text-[#8B5CF6]">12.4M</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
                +18% so với hôm qua
              </div>
            </div>

            <div className="landing-float absolute -right-1 top-2 z-10 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-2 text-[10px] font-bold text-amber-800 shadow-md">
              🍳 KDS · 3 đơn chờ
            </div>
          </div>
        </div>

        {/* Marquee roles */}
        <div className="relative border-t border-white/50 bg-white/40 py-4 backdrop-blur-sm">
          <div className="overflow-hidden">
            <div className="landing-marquee-track flex w-max gap-3">
              {[...ROLE_PILLS, ...ROLE_PILLS].map((r, i) => (
                <span
                  key={`${r.label}-${i}`}
                  className={`shrink-0 rounded-full border px-5 py-2 text-sm font-semibold shadow-sm ${r.className}`}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="relative bg-white py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B6B] via-[#8B5CF6] to-[#2F80ED]" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-gradient-to-r from-sky-100 via-violet-100 to-rose-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-700">
              Ba gói linh hoạt
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Chọn đúng quy mô cửa hàng
            </h2>
            <p className="mt-3 text-stone-500">
              Solo cho một mình · Store cho quán có nhân viên · Chain cho chuỗi đa chi nhánh
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {SEGMENTS.map((s) => (
              <div
                key={s.slug}
                className={`group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-8 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${s.accent} ${s.border} ${
                  s.popular
                    ? 'shadow-xl shadow-sky-200/60 ring-2 ring-[#2F80ED]/30'
                    : 'shadow-md'
                }`}
              >
                {s.popular && (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#2F80ED] to-violet-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                    Phổ biến
                  </span>
                )}
                <span className="text-4xl">{s.emoji}</span>
                <h3 className="mt-4 text-xl font-bold text-stone-900">{s.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{s.tagline}</p>
                <p
                  className={`mt-6 text-3xl font-extrabold ${
                    s.slug === 'solo'
                      ? 'text-[#2F80ED]'
                      : s.slug === 'store'
                        ? 'text-emerald-600'
                        : 'text-violet-600'
                  }`}
                >
                  {s.priceLabel}
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-stone-600">
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
                      ✓
                    </span>
                    {s.employees}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
                      ✓
                    </span>
                    {s.branches}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
                      ✓
                    </span>
                    Trial 7 ngày Premium
                  </li>
                </ul>
                <Link
                  href={`/register?plan=${s.slug}`}
                  className={`mt-8 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold shadow-md transition ${PLAN_BTN[s.slug]}`}
                >
                  Chọn {s.shortName}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento features ── */}
      <section className="relative py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-50/50 via-transparent to-amber-50/40" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600">
                Tất cả trong một
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-stone-900">Tính năng cốt lõi</h2>
            </div>
            <p className="max-w-md text-sm text-stone-500">
              Không cần ghép nhiều app — mọi bộ phận làm việc trên cùng dữ liệu realtime.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-3xl border-2 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${f.cardBorder} ${f.span}`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.wash} to-transparent opacity-60`}
                />
                <div className="relative">
                  <div className={`mb-5 inline-flex rounded-2xl p-3 ${f.iconBg}`}>
                    <FeatureIcon type={f.icon} />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-violet-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-stone-900">Bắt đầu trong 3 bước</h2>
            <p className="mt-2 text-stone-500">Từ đăng ký đến bán hàng — vài phút là xong</p>
          </div>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-10 hidden h-1 rounded-full bg-gradient-to-r from-[#2F80ED] via-emerald-400 to-violet-500 md:block" />
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-3xl border border-white bg-white/80 p-6 text-center shadow-lg shadow-violet-100/50 backdrop-blur-sm md:text-left"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white shadow-lg md:mx-0 ${s.badge} ${s.shadow}`}
                >
                  {s.n}
                </div>
                <h3 className="mt-5 text-lg font-bold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-8">
        <TrialPaymentExplainer />
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-8 pt-4">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem]">
          <div className={`absolute inset-0 ${MARKETING.ctaGradient}`} />
          <div className="pointer-events-none absolute inset-0 landing-cta-mesh" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl" />

          <div className="relative px-8 py-16 text-center text-white sm:py-20">
            <div className="mx-auto mb-6 flex w-fit gap-2">
              {['🧋', '☕', '🍵'].map((e) => (
                <span
                  key={e}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl backdrop-blur-sm"
                >
                  {e}
                </span>
              ))}
            </div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Sẵn sàng với BOBAPOS?</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/90">
              7 ngày Premium miễn phí · Menu & kho mẫu sẵn có · Không cần thẻ tín dụng
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-2xl bg-white px-10 py-4 text-sm font-bold text-violet-600 shadow-xl transition hover:bg-amber-50"
              >
                Tạo cửa hàng miễn phí
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border-2 border-white/60 bg-white/10 px-10 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
