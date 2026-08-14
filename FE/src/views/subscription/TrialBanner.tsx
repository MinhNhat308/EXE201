'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/brand';
import {
  getDaysLeft,
  getStoredSubscription,
  getStoredTenant,
  getSubscriptionDaysLeft,
  getSubscriptionStatus,
  getTrialDaysLeft,
} from '@/lib/auth-storage';
import { getBillingPath } from '@/lib/workspace-routes';
import { SubscriptionInfo, SubscriptionStatus, TenantInfo } from '@/models/tenant.model';
import { UpgradeModal } from './UpgradeModal';

export function TrialBanner() {
  const [trialDays, setTrialDays] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [billingPath, setBillingPath] = useState('/dashboard/admin/billing');

  useEffect(() => {
    const applyLocal = () => {
      const t = getStoredTenant<TenantInfo>();
      const days = getTrialDaysLeft();
      const activeDays = getDaysLeft();
      const st = getSubscriptionStatus();
      setTrialDays(days);
      setDaysLeft(activeDays);
      setStatus(st);
      setTenant(t);
      setBillingPath(getBillingPath(t));

      const sub = getStoredSubscription<SubscriptionInfo>();
      const remaining = getSubscriptionDaysLeft();
      if (
        (sub?.status === SubscriptionStatus.TRIAL || sub?.status === SubscriptionStatus.ACTIVE) &&
        remaining > 0 &&
        remaining <= 3
      ) {
        setShowUpgrade(true);
      }
    };
    applyLocal();
    const id = window.setInterval(applyLocal, 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (status === SubscriptionStatus.EXPIRED || status === SubscriptionStatus.SUSPENDED) {
    return (
      <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Gói BOBAPOS đã hết hạn — bạn có thể xem dữ liệu nhưng không thể thao tác mới.
          </span>
          <Link
            href={billingPath}
            className={`rounded-lg px-4 py-1.5 font-semibold text-white ${BRAND.primary}`}
          >
            Gia hạn ngay
          </Link>
        </div>
      </div>
    );
  }

  if (status === SubscriptionStatus.TRIAL && trialDays > 0) {
    return (
      <>
        <div className={`border-b px-4 py-2.5 text-sm text-white bg-gradient-to-r ${BRAND.headerGradient}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Bạn đang dùng thử <strong>BOBAPOS Premium</strong> — còn{' '}
              <strong>{trialDays}</strong> ngày
              {tenant?.storeName ? ` · ${tenant.storeName}` : ''}
            </span>
            <Link
              href={billingPath}
              className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
            >
              Thanh toán gói
            </Link>
          </div>
        </div>
        <UpgradeModal
          open={showUpgrade}
          daysLeft={trialDays}
          billingPath={billingPath}
          mode="trial"
          onClose={() => setShowUpgrade(false)}
        />
      </>
    );
  }

  if (status === SubscriptionStatus.ACTIVE && daysLeft > 0) {
    const urgent = daysLeft <= 7;
    return (
      <>
        <div
          className={`border-b px-4 py-2.5 text-sm ${
            urgent
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-emerald-200 bg-emerald-50 text-emerald-950'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {urgent ? (
                <>
                  Gói BOBAPOS <strong>sắp hết hạn</strong> — còn <strong>{daysLeft}</strong> ngày
                </>
              ) : (
                <>
                  Gói BOBAPOS đang hoạt động — còn <strong>{daysLeft}</strong> ngày
                </>
              )}
              {tenant?.storeName ? ` · ${tenant.storeName}` : ''}
            </span>
            <Link
              href={billingPath}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                urgent
                  ? `text-white ${BRAND.primary}`
                  : 'border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Gia hạn gói
            </Link>
          </div>
        </div>
        <UpgradeModal
          open={showUpgrade && urgent}
          daysLeft={daysLeft}
          billingPath={billingPath}
          mode="renewal"
          onClose={() => setShowUpgrade(false)}
        />
      </>
    );
  }

  return null;
}
