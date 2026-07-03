'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { PublicController } from '@/controllers/public.controller';
import { parsePlanParam, SEGMENTS, SEGMENT_BY_PLAN } from '@/lib/segments';
import { BRAND } from '@/lib/brand';
import { SubscriptionPlan } from '@/models/tenant.model';
import { AuthMarketingLayout } from '@/views/auth/AuthMarketingLayout';
import { TrialPaymentExplainer } from '@/views/marketing/TrialPaymentExplainer';

const PLAN_BTN: Record<string, string> = {
  SOLO: 'ring-sky-200 hover:ring-sky-400',
  STANDARD: 'ring-emerald-200 hover:ring-emerald-400',
  PREMIUM: 'ring-violet-200 hover:ring-violet-400',
};

const PLAN_PRICE_COLOR: Record<string, string> = {
  SOLO: 'text-[#2F80ED]',
  STANDARD: 'text-emerald-600',
  PREMIUM: 'text-violet-600',
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'plan' | 'form'>('plan');
  const [intendedPlan, setIntendedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
  });

  useEffect(() => {
    const fromUrl = parsePlanParam(searchParams.get('plan'));
    if (fromUrl) {
      setIntendedPlan(fromUrl);
      setStep('form');
    }
  }, [searchParams]);

  const pickPlan = (plan: SubscriptionPlan) => {
    setIntendedPlan(plan);
    setStep('form');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!intendedPlan) return;
    setLoading(true);
    setError('');
    try {
      await PublicController.register({ ...form, intendedPlan });
      const params = new URLSearchParams({ registered: '1', email: form.email.trim() });
      router.replace(`/login?${params}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const selected = intendedPlan ? SEGMENT_BY_PLAN[intendedPlan] : null;

  return (
    <AuthMarketingLayout
      title="Mở cửa hàng trên BOBAPOS"
      subtitle="Chọn gói Solo · Store · Chain — trial 7 ngày đủ tính năng, menu & kho mẫu sẵn có."
    >
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
            step === 'plan'
              ? 'bg-gradient-to-br from-[#2F80ED] to-violet-500 text-white shadow-md'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {step === 'form' ? '✓' : '1'}
        </div>
        <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#2F80ED] via-violet-300 to-rose-200" />
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
            step === 'form'
              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md'
              : 'bg-stone-100 text-stone-400'
          }`}
        >
          2
        </div>
      </div>

      <div className="mb-6">
        <span className="inline-flex rounded-full bg-gradient-to-r from-emerald-100 via-sky-100 to-violet-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          {step === 'plan' ? 'Bước 1 · Chọn gói' : 'Bước 2 · Thông tin'}
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-stone-900">
          {step === 'plan' ? 'Chọn gói BOBAPOS' : 'Thông tin cửa hàng'}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {step === 'plan'
            ? 'Một hệ thống — chọn đúng quy mô từ đầu'
            : selected
              ? `${selected.emoji} Gói ${selected.shortName}: ${selected.tagline}`
              : 'Trial 7 ngày · Không cần thẻ'}
        </p>
      </div>

      {step === 'plan' ? (
        <>
        <TrialPaymentExplainer variant="compact" showBillingNote={false} />
        <div className="mt-6 space-y-3">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.plan}
              type="button"
              onClick={() => pickPlan(seg.plan)}
              className={`group w-full rounded-2xl border-2 bg-gradient-to-br p-4 text-left ring-2 ring-transparent transition hover:-translate-y-0.5 hover:shadow-lg ${seg.accent} ${seg.border} ${PLAN_BTN[seg.plan]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{seg.emoji}</span>
                {seg.popular && (
                  <span className="rounded-full bg-gradient-to-r from-[#2F80ED] to-violet-500 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    Phổ biến
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-bold text-stone-900">{seg.name}</p>
              <p className="mt-0.5 text-sm text-stone-600">{seg.tagline}</p>
              <p className={`mt-2 text-sm font-bold ${PLAN_PRICE_COLOR[seg.plan]}`}>
                {seg.priceLabel}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-stone-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className={`font-semibold ${BRAND.primaryText}`}>
            Đăng nhập
          </Link>
        </p>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {selected && (
            <div
              className={`rounded-2xl border-2 bg-gradient-to-br p-4 ${selected.accent} ${selected.border}`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Gói đã chọn
              </p>
              <p className="mt-1 font-bold text-stone-900">
                {selected.emoji} {selected.name} — {selected.priceLabel}
              </p>
              <button
                type="button"
                onClick={() => setStep('plan')}
                className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-800"
              >
                ← Đổi gói
              </button>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">
              Tên cửa hàng *
            </label>
            <input
              required
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className={BRAND.input}
              placeholder="VD: Trà Sữa Giọt Nắng"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">
              Họ tên chủ cửa hàng *
            </label>
            <input
              required
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className={BRAND.input}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">
              Email đăng nhập *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={BRAND.input}
              placeholder="owner@yourstore.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={BRAND.input}
              placeholder="0901234567"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">Mật khẩu *</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={BRAND.input}
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-[#2F80ED] to-violet-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-300/30 transition hover:shadow-xl disabled:opacity-60"
          >
            {loading ? 'Đang tạo cửa hàng...' : 'Tạo cửa hàng & bắt đầu trial →'}
          </button>

          <p className="pt-2 text-center text-sm text-stone-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className={`font-semibold ${BRAND.primaryText}`}>
              Đăng nhập
            </Link>
          </p>
        </form>
      )}
    </AuthMarketingLayout>
  );
}

export function RegisterView() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF0E6] via-[#EBF5FF] to-[#F3EEFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
