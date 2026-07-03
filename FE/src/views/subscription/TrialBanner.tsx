'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/brand';
import {
  getStoredSubscription,
  getStoredTenant,
  getSubscriptionStatus,
  getTrialDaysLeft,
} from '@/lib/auth-storage';
import { SubscriptionInfo, SubscriptionStatus, TenantInfo } from '@/models/tenant.model';
import { UpgradeModal } from './UpgradeModal';

export function TrialBanner() {
  const [trialDays, setTrialDays] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  useEffect(() => {
    const applyLocal = () => {
      const days = getTrialDaysLeft();
      const st = getSubscriptionStatus();
      setTrialDays(days);
      setStatus(st);
      setTenant(getStoredTenant<TenantInfo>());
      const sub = getStoredSubscription<SubscriptionInfo>();
      if (sub?.status === SubscriptionStatus.TRIAL && days > 0 && days <= 3) {
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
            href="/dashboard/admin/billing"
            className={`rounded-lg px-4 py-1.5 font-semibold text-white ${BRAND.primary}`}
          >
            Nâng cấp ngay
          </Link>
        </div>
      </div>
    );
  }

  if (status !== SubscriptionStatus.TRIAL || trialDays <= 0) {
    return null;
  }

  return (
    <>
      <div className={`border-b px-4 py-2.5 text-sm text-white bg-gradient-to-r ${BRAND.headerGradient}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Bạn đang sử dụng <strong>BOBAPOS Premium Trial</strong> — còn{' '}
            <strong>{trialDays}</strong> ngày
            {tenant?.storeName ? ` · ${tenant.storeName}` : ''}
          </span>
          <Link
            href="/dashboard/admin/billing"
            className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
          >
            Nâng cấp gói
          </Link>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} daysLeft={trialDays} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
