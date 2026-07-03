'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PublicController } from '@/controllers/public.controller';
import { MARKETING } from '@/lib/brand';
import { SEGMENTS, SEGMENT_BY_PLAN } from '@/lib/segments';
import { SubscriptionPlan } from '@/models/tenant.model';
import { MarketingShell } from '@/views/marketing/MarketingShell';
import { TrialPaymentExplainer } from '@/views/marketing/TrialPaymentExplainer';

type Plan = {
  id: string;
  name: string;
  priceMonthly: number;
  maxEmployees: number;
  maxBranches: number;
  features: string[];
};

const PLAN_STYLE: Record<
  string,
  {
    accent: string;
    border: string;
    priceColor: string;
    btn: string;
    emoji: string;
    popular?: boolean;
  }
> = {
  SOLO: {
    accent: 'from-sky-100 via-blue-50 to-white',
    border: 'border-sky-200',
    priceColor: 'text-[#2F80ED]',
    btn: 'bg-gradient-to-r from-[#2F80ED] to-sky-500 text-white shadow-sky-200/50',
    emoji: '☕',
    popular: true,
  },
  STANDARD: {
    accent: 'from-emerald-100 via-teal-50 to-white',
    border: 'border-emerald-200',
    priceColor: 'text-emerald-600',
    btn: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200/50',
    emoji: '🏪',
  },
  PREMIUM: {
    accent: 'from-violet-100 via-fuchsia-50 to-white',
    border: 'border-violet-200',
    priceColor: 'text-violet-600',
    btn: 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-violet-200/50',
    emoji: '🏢',
  },
};

const COMPARE_ROWS = [
  { label: 'POS & thu ngân', solo: true, store: true, chain: true },
  { label: 'Bếp KDS realtime', solo: true, store: true, chain: true },
  { label: 'Quản lý kho & NCC', solo: true, store: true, chain: true },
  { label: 'Nhiều nhân viên', solo: false, store: true, chain: true },
  { label: 'Đa chi nhánh', solo: false, store: false, chain: true },
  { label: 'Báo cáo chuỗi', solo: false, store: false, chain: true },
];

export function PricingView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialDays, setTrialDays] = useState(7);

  useEffect(() => {
    PublicController.getPlans()
      .then((res) => {
        setPlans(res.plans);
        setTrialDays(res.trialDays);
      })
      .catch(() => {});
  }, []);

  const displayPlans =
    plans.length > 0
      ? plans
      : SEGMENTS.map((seg) => ({
          id: seg.plan,
          name: seg.name,
          priceMonthly:
            seg.plan === SubscriptionPlan.SOLO
              ? 99_000
              : seg.plan === SubscriptionPlan.STANDARD
                ? 299_000
                : 599_000,
          maxEmployees: seg.plan === SubscriptionPlan.SOLO ? 1 : seg.plan === SubscriptionPlan.STANDARD ? 10 : 9999,
          maxBranches: seg.plan === SubscriptionPlan.PREMIUM ? 99 : 1,
          features: [seg.tagline, seg.employees, seg.branches],
        }));

  return (
    <MarketingShell active="pricing">
      {/* Hero */}
      <section className={`relative overflow-hidden ${MARKETING.heroBg} py-16 lg:py-20`}>
        <div className="pointer-events-none absolute inset-0 landing-hero-mesh" />
        <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <span className="inline-flex rounded-full bg-gradient-to-r from-sky-100 via-violet-100 to-rose-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-700">
            Bảng giá BOBAPOS
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Chọn gói phù hợp
            <span className="mt-1 block landing-shimmer-text">quy mô cửa hàng</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
            Dùng thử Premium miễn phí{' '}
            <strong className="text-[#FF6B6B]">{trialDays} ngày</strong> — không cần thẻ tín
            dụng. Solo · Store · Chain trên cùng một nền tảng.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="relative -mt-6 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div
            className={`grid gap-6 ${displayPlans.length >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}
          >
            {displayPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} trialDays={trialDays} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <TrialPaymentExplainer />
      </section>

      {/* Compare table */}
      <section className="border-y border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-sky-50/80 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-extrabold text-stone-900">So sánh nhanh</h2>
          <p className="mt-2 text-center text-sm text-stone-500">
            Tất cả gói đều có trial {trialDays} ngày đủ tính năng Premium
          </p>
          <div className="mt-10 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-gradient-to-r from-sky-50 via-violet-50 to-rose-50">
                  <th className="px-5 py-4 text-left font-bold text-stone-700">Tính năng</th>
                  <th className="px-4 py-4 text-center font-bold text-[#2F80ED]">Solo</th>
                  <th className="px-4 py-4 text-center font-bold text-emerald-600">Store</th>
                  <th className="px-4 py-4 text-center font-bold text-violet-600">Chain</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'}
                  >
                    <td className="px-5 py-3.5 font-medium text-stone-700">{row.label}</td>
                    {(['solo', 'store', 'chain'] as const).map((col) => (
                      <td key={col} className="px-4 py-3.5 text-center">
                        {row[col] ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                            ✓
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-12">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem]">
          <div className={`absolute inset-0 ${MARKETING.ctaGradient}`} />
          <div className="pointer-events-none absolute inset-0 landing-cta-mesh" />
          <div className="relative px-8 py-14 text-center text-white">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Chưa chắc chọn gói nào?</h2>
            <p className="mx-auto mt-3 max-w-md text-white/90">
              Bắt đầu trial {trialDays} ngày — đổi gói sau khi quán phát triển.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex rounded-2xl bg-white px-10 py-4 text-sm font-bold text-violet-600 shadow-xl transition hover:bg-amber-50"
            >
              Đăng ký miễn phí →
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function PlanCard({ plan, trialDays }: { plan: Plan; trialDays: number }) {
  const style = PLAN_STYLE[plan.id] ?? PLAN_STYLE.SOLO;
  const seg = SEGMENT_BY_PLAN[plan.id as SubscriptionPlan];
  const isPopular = style.popular;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-8 transition hover:-translate-y-1 hover:shadow-2xl ${style.accent} ${style.border} ${
        isPopular ? 'shadow-xl shadow-sky-200/60 ring-2 ring-[#2F80ED]/25' : 'shadow-lg'
      }`}
    >
      {isPopular && (
        <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#2F80ED] to-violet-500 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-md">
          Phổ biến
        </span>
      )}

      <span className="text-4xl">{style.emoji}</span>
      <h2 className="mt-4 text-xl font-bold text-stone-900">{plan.name}</h2>
      {seg && <p className="mt-1 text-sm text-stone-500">{seg.tagline}</p>}

      <p className={`mt-6 text-4xl font-extrabold ${style.priceColor}`}>
        {plan.priceMonthly.toLocaleString('vi-VN')}
        <span className="text-base font-semibold text-stone-400"> đ/tháng</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3 text-sm text-stone-600">
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
            ✓
          </span>
          Tối đa {plan.maxEmployees >= 9999 ? 'không giới hạn' : plan.maxEmployees} nhân viên
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
            ✓
          </span>
          Tối đa {plan.maxBranches >= 99 ? 'đa chi nhánh' : `${plan.maxBranches} chi nhánh`}
        </li>
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
              ✓
            </span>
            {f}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs text-rose-500">
            ★
          </span>
          Trial {trialDays} ngày Premium
        </li>
      </ul>

      <Link
        href={`/register?plan=${plan.id}`}
        className={`mt-8 block rounded-xl py-3.5 text-center text-sm font-bold shadow-md transition hover:shadow-lg ${style.btn}`}
      >
        Dùng thử {trialDays} ngày →
      </Link>
    </div>
  );
}
