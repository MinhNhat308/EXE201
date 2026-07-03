'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { BRAND } from '@/lib/brand';
import { saveAuth, getToken, getStoredUser } from '@/lib/auth-storage';
import {
  SubscriptionInfo,
  SubscriptionPlan,
  SubscriptionStatus,
  TenantInfo,
} from '@/models/tenant.model';
import { SEGMENTS, segmentLabel } from '@/lib/segments';
import { AdminLayout } from './AdminLayout';

export function SubscriptionManageView() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);
  const [usage, setUsage] = useState<{ employees: number; maxEmployees: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SubscriptionPlan | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await SubscriptionController.get();
      setTenant(res.tenant);
      setSubscription(res.subscription);
      setTrialDaysLeft(res.trialDaysLeft);
      setDaysLeft(res.daysLeft);
      setUsage(res.usage);

      const token = getToken();
      const user = getStoredUser();
      if (token && user) {
        saveAuth(token, user, {
          tenant: res.tenant,
          subscription: res.subscription,
          trialDaysLeft: res.trialDaysLeft,
          plan: res.subscription.plan,
          status: res.subscription.status,
        });
      }
    } catch {
      setMessage('Không tải được thông tin gói');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setUpgrading(plan);
    setMessage('');
    try {
      await SubscriptionController.upgrade(plan);
      setMessage(
        `Đã chọn gói ${segmentLabel(plan)}. Tạo hóa đơn và thanh toán tại mục Thanh toán để kích hoạt.`,
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Nâng cấp thất bại');
    } finally {
      setUpgrading(null);
    }
  };

  const displayDays =
    subscription?.status === SubscriptionStatus.TRIAL ? trialDaysLeft : daysLeft;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold">Gói đăng ký BOBAPOS</h1>
      <p className="mt-1 text-stone-500">
        Trial 7 ngày Premium → sau đó thanh toán gói đã chọn tại mục Thanh toán
      </p>

      <Link
        href="/dashboard/admin/billing"
        className={`mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md ${BRAND.primary}`}
      >
        Thanh toán & gia hạn gói →
      </Link>

      {loading ? (
        <p className="mt-8 text-stone-500">Đang tải...</p>
      ) : (
        <div className="mt-8 space-y-6">
          {tenant && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-stone-500">Cửa hàng</p>
              <p className="text-xl font-bold">{tenant.storeName}</p>
              <p className="text-sm text-stone-600">
                Slug: <code className="rounded bg-stone-100 px-1">{tenant.slug}</code>
                {tenant.intendedPlan && tenant.status === 'TRIAL' && (
                  <>
                    {' '}
                    · Sau trial: <strong>{segmentLabel(tenant.intendedPlan)}</strong>
                  </>
                )}
              </p>
            </div>
          )}

          {subscription && (
            <div className={`rounded-2xl border p-6 ${BRAND.primarySoft}`}>
              <div className="flex flex-wrap gap-4 justify-between">
                <div>
                  <p className="text-sm opacity-70">Gói hiện tại</p>
                  <p className="text-2xl font-bold">
                    {subscription.status === SubscriptionStatus.TRIAL
                      ? 'Premium Trial'
                      : segmentLabel(subscription.plan)}
                  </p>
                  <p className="mt-1">
                    Trạng thái: <strong>{subscription.status}</strong> · Còn{' '}
                    <strong>{displayDays}</strong> ngày
                  </p>
                  {subscription.status === SubscriptionStatus.TRIAL && tenant?.intendedPlan && (
                    <p className="mt-2 text-sm">
                      Sau trial sẽ chuyển sang gói{' '}
                      <strong>{segmentLabel(tenant.intendedPlan)}</strong> khi bạn thanh toán tại{' '}
                      <Link href="/dashboard/admin/billing" className="font-semibold underline">
                        Thanh toán & hóa đơn
                      </Link>
                      .
                    </p>
                  )}
                  {usage && (
                    <p className="mt-2 text-sm">
                      Nhân viên: {usage.employees}/{usage.maxEmployees}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {SEGMENTS.map((seg) => (
              <div key={seg.plan} className="rounded-2xl border bg-white p-5 shadow-sm">
                <h3 className="font-bold">{seg.name}</h3>
                <p className="mt-1 text-sm text-stone-600">{seg.tagline}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {seg.employees} · {seg.branches}
                </p>
                <button
                  type="button"
                  disabled={subscription?.plan === seg.plan || upgrading !== null}
                  onClick={() => handleUpgrade(seg.plan)}
                  className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${BRAND.primary}`}
                >
                  {upgrading === seg.plan
                    ? 'Đang xử lý...'
                    : subscription?.plan === seg.plan
                      ? 'Đang dùng'
                      : `Chọn ${seg.shortName}`}
                </button>
              </div>
            ))}
          </div>

          {message && (
            <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
              {message}
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
