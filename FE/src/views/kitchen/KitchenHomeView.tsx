'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePolling } from '@/lib/use-polling';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { OrderController } from '@/controllers/order.controller';
import { getStoredUser } from '@/lib/auth-storage';
import { canAccessRole } from '@/lib/role-access';
import { kitchenStatusCounts } from '@/lib/kitchen-order-utils';
import { useStableStaffSession } from '@/lib/use-staff-session';
import { STORE_CHECK_IN_PATH, STORE_KITCHEN_ORDERS_PATH } from '@/lib/workspace-routes';
import { normalizeStatus, OrderStatus } from '@/models/order.model';
import { WORK_SHIFT_LABELS } from '@/models/staff.model';
import { Role, User } from '@/models/user.model';
import { KitchenLayout } from './KitchenLayout';

export function KitchenHomeView() {
  const router = useRouter();
  const { session, refresh } = useStableStaffSession();
  const workShift = session?.checkedInRole === Role.KITCHEN ? session.workShift : undefined;
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState({ pending: 0, preparing: 0, ready: 0, active: 0 });

  const load = useCallback(async () => {
    try {
      const orders = await OrderController.getToday(workShift, true);
      const active = orders.filter(
        (o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED,
      );
      setCounts(kitchenStatusCounts(active));
    } catch {
      /* ignore */
    }
  }, [workShift]);

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || !canAccessRole(stored.role, Role.KITCHEN)) {
      router.replace('/login');
      return;
    }
    setUser(stored);

    if (stored.role === Role.KITCHEN) {
      void refresh().then((active) => {
        if (!active || active.checkedInRole !== Role.KITCHEN) {
          router.replace(STORE_CHECK_IN_PATH);
        }
      });
    }
  }, [router, refresh]);

  usePolling(load, 12_000, !!user);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-stone-500">
        Đang tải...
      </div>
    );
  }

  return (
    <KitchenLayout>
      <div
        className={`rounded-2xl bg-gradient-to-r ${BRAND.headerGradient} p-6 text-white shadow-lg`}
      >
        <h1 className="text-2xl font-bold">Tổng quan Bếp</h1>
        <p className="mt-2 text-sm text-white/85">
          {workShift
            ? `Ca ${WORK_SHIFT_LABELS[workShift]} · Kanban 3 cột · thông báo đơn mới`
            : 'Kanban KDS · theo dõi đơn realtime'}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Chưa làm"
          value={counts.pending}
          className="border-amber-200 bg-amber-50 text-amber-900"
        />
        <StatCard
          label="Đang làm"
          value={counts.preparing}
          className="border-sky-200 bg-sky-50 text-sky-900"
        />
        <StatCard
          label="Sẵn sàng bưng"
          value={counts.ready}
          className="border-emerald-200 bg-emerald-50 text-emerald-900"
        />
      </div>

      <Link
        href={STORE_KITCHEN_ORDERS_PATH}
        className={`mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-sm ${BRAND.primary}`}
      >
        🍳 Mở KDS bếp (Kanban)
      </Link>

      <div className="mt-10 rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Quy trình bếp Store</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Thu ngân tạo đơn → <strong>Chưa làm</strong></li>
          <li>Bếp bấm <strong>Bắt đầu làm</strong> → Đang làm</li>
          <li>Bấm <strong>Xong</strong> → Sẵn sàng bưng (trừ kho theo công thức)</li>
          <li>Phục vụ mang ra → Hoàn tất</li>
        </ol>
      </div>
    </KitchenLayout>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${className}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
