'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/brand';
import { getBillingPath } from '@/lib/workspace-routes';
import { SubscriptionController } from '@/controllers/subscription.controller';

export function SubscriptionCard() {
  const [data, setData] = useState<{
    plan: string;
    status: string;
    daysLeft: number;
    trialDaysLeft: number;
    usage?: { employees: number; maxEmployees: number };
  } | null>(null);

  useEffect(() => {
    SubscriptionController.get()
      .then((res) =>
        setData({
          plan: res.subscription.plan,
          status: res.subscription.status,
          daysLeft: res.daysLeft,
          trialDaysLeft: res.trialDaysLeft,
          usage: res.usage,
        }),
      )
      .catch(() => {});
  }, []);

  if (!data) return null;

  const days =
    data.status === 'TRIAL' ? data.trialDaysLeft : data.daysLeft;

  return (
    <div className={`rounded-xl border p-4 ${BRAND.primarySoft}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase opacity-70">Gói BOBAPOS</p>
          <p className="text-lg font-bold">{data.plan}</p>
          <p className="text-sm">
            Trạng thái: <strong>{data.status}</strong> · Còn{' '}
            <strong>{days}</strong> ngày
          </p>
          {data.usage && (
            <p className="mt-1 text-xs text-stone-600">
              Nhân viên: {data.usage.employees}/{data.usage.maxEmployees}
            </p>
          )}
        </div>
        <Link
          href={getBillingPath()}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${BRAND.primary}`}
        >
          Gia hạn gói
        </Link>
      </div>
    </div>
  );
}
