'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthController } from '@/controllers/auth.controller';
import { OrderController } from '@/controllers/order.controller';
import { getStoredTenant, getStoredUser } from '@/lib/auth-storage';
import { isStoreOwner } from '@/lib/role-access';
import { BRAND } from '@/lib/brand';
import {
  DashboardTopBar,
  HubActionCard,
  HubStatStrip,
  PageLoading,
} from '@/views/components/app-ui';
import { staffSessionKey, useStableStaffSession } from '@/lib/use-staff-session';
import { endStaffSessionRemote } from '@/lib/staff-session-storage';
import {
  STORE_CASHIER_ORDERS_PATH,
  STORE_CASHIER_POS_PATH,
  STORE_CHECK_IN_PATH,
} from '@/lib/workspace-routes';
import { normalizeStatus, OrderStatus } from '@/models/order.model';
import { WORK_SHIFT_LABELS, WorkRole } from '@/models/staff.model';
import { TenantInfo } from '@/models/tenant.model';
import { Role, User } from '@/models/user.model';

type TodayStats = {
  orderCount: number;
  revenue: number;
};

export function StoreStaffHubView() {
  const router = useRouter();
  const { session, refresh } = useStableStaffSession();
  const sessionKey = staffSessionKey(session);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [stats, setStats] = useState<TodayStats>({ orderCount: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const authChecked = useRef(false);

  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;

    let cancelled = false;

    async function init() {
      const stored = getStoredUser<User>();
      if (!stored || stored.role !== Role.STAFF) {
        router.replace('/login');
        return;
      }

      const active = (await refresh()) ?? session;
      if (cancelled) return;

      if (
        !active ||
        active.checkedInRole !== Role.STAFF ||
        active.workRole !== WorkRole.CASHIER
      ) {
        router.replace(STORE_CHECK_IN_PATH);
        return;
      }

      if (!isStoreOwner(stored.role)) {
        router.replace(STORE_CASHIER_ORDERS_PATH);
        return;
      }

      setUser(stored);
      setTenant(getStoredTenant<TenantInfo>());
    }

    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auth gate
  }, [router]);

  const loadStats = useCallback(async (workShift: string) => {
    setLoading(true);
    try {
      const orders = await OrderController.getToday(
        workShift as Parameters<typeof OrderController.getToday>[0],
      );
      const active = orders.filter(
        (o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED,
      );
      const completed = active.filter(
        (o) => normalizeStatus(o.status) === OrderStatus.COMPLETED,
      );
      setStats({
        orderCount: active.length,
        revenue: completed.reduce((s, o) => s + (o.total ?? 0), 0),
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionKey || !session?.workShift) return;
    void loadStats(session.workShift);
  }, [sessionKey, session?.workShift, loadStats]);

  const logout = () => {
    void endStaffSessionRemote();
    AuthController.logout();
    router.replace('/login');
  };

  const changeShift = () => {
    void endStaffSessionRemote();
    router.replace(STORE_CHECK_IN_PATH);
  };

  if (!user || !session) return <PageLoading />;

  const storeName = tenant?.storeName ?? 'Cửa hàng';

  const cards = [
    {
      href: STORE_CASHIER_POS_PATH,
      emoji: '🛒',
      title: 'Bán hàng (POS)',
      desc: 'Tạo đơn, thanh toán, in hóa đơn',
      accent: 'border-[#2F80ED]/30 bg-gradient-to-br from-[#2F80ED]/10 to-white',
    },
    {
      href: STORE_CASHIER_ORDERS_PATH,
      emoji: '📋',
      title: 'Đơn hôm nay',
      desc: 'Xem, sửa hoặc hủy đơn trong ca',
      accent: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    },
  ];

  return (
    <div className={`min-h-screen ${BRAND.pageBg}`}>
      <DashboardTopBar
        eyebrow={`Thu ngân · ${WORK_SHIFT_LABELS[session.workShift]}`}
        title={storeName}
        userName={user.fullName}
        onLogout={logout}
        actions={
          <button type="button" onClick={changeShift} className={BRAND.btnGhost}>
            Đổi ca
          </button>
        }
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="text-center">
          <p className="text-sm text-stone-500">Quầy thu ngân · Store</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            Chọn màn hình làm việc
          </h1>
        </div>

        <div className={`mt-8 ${loading ? 'animate-pulse' : ''}`}>
          <HubStatStrip
            loading={loading}
            orderCount={stats.orderCount}
            revenue={stats.revenue}
            shiftLabel={WORK_SHIFT_LABELS[session.workShift]}
          />
        </div>

        <div className="mt-8 grid gap-4">
          {cards.map((card) => (
            <HubActionCard key={card.href} {...card} description={card.desc} />
          ))}
        </div>
      </main>
    </div>
  );
}
