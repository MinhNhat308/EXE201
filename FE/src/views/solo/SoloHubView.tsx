'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderController } from '@/controllers/order.controller';
import { getStoredTenant, getStoredUser } from '@/lib/auth-storage';
import { HubActionCard, HubStatStrip } from '@/views/components/app-ui';
import { isSoloOperatingPlan } from '@/lib/workspace-routes';
import {
  SOLO_POS_PATH,
  SOLO_SALES_PATH,
  SOLO_SETTINGS_PATH,
} from '@/lib/workspace-routes';
import { normalizeStatus, OrderStatus } from '@/models/order.model';
import { TenantInfo } from '@/models/tenant.model';
import { Role, User } from '@/models/user.model';
import { SoloShellLayout } from './SoloShellLayout';

type TodayStats = {
  orderCount: number;
  revenue: number;
};

export function SoloHubView() {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [stats, setStats] = useState<TodayStats>({ orderCount: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (skipCache = false) => {
    try {
      const orders = await OrderController.getToday(undefined, false, undefined, skipCache);
      const sold = orders.filter(
        (o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED,
      );
      setStats({
        orderCount: sold.length,
        revenue: sold.reduce((s, o) => s + (o.total ?? 0), 0),
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser<User>();
    const t = getStoredTenant<TenantInfo>();
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/login');
      return;
    }
    if (!isSoloOperatingPlan(t)) {
      router.replace('/dashboard/admin');
      return;
    }
    setTenant(t);
    void loadStats(true);
  }, [router, loadStats]);

  const storeName = tenant?.storeName ?? 'cửa hàng';

  const cards = [
    {
      href: SOLO_POS_PATH,
      emoji: '🛒',
      title: 'Bán hàng',
      desc: 'Mở quầy thu ngân — chọn món, thanh toán, in hóa đơn',
      accent: 'border-[#2F80ED]/30 bg-gradient-to-br from-[#2F80ED]/10 to-white',
    },
    {
      href: SOLO_SALES_PATH,
      emoji: '📋',
      title: 'Hóa đơn & doanh thu',
      desc: 'Xem đơn hôm nay, thống kê bán hàng, in lại bill',
      accent: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    },
    {
      href: SOLO_SETTINGS_PATH,
      emoji: '⚙️',
      title: 'Cài đặt',
      desc: 'Giá món, kho & công thức (tùy chọn), tên quán trên hóa đơn',
      accent: 'border-stone-200 bg-white',
    },
  ];

  return (
    <SoloShellLayout>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="text-center">
          <p className="text-sm text-stone-500">Chào</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            {storeName}
          </h1>
          <p className="mt-2 text-sm text-stone-500">Bạn muốn sử dụng dịch vụ nào?</p>
        </div>

        <div className={`mt-8 ${loading ? 'animate-pulse' : ''}`}>
          <HubStatStrip loading={loading} orderCount={stats.orderCount} revenue={stats.revenue} />
        </div>

        <div className="mt-8 grid gap-4">
          {cards.map((card) => (
            <HubActionCard key={card.href} {...card} description={card.desc} />
          ))}
        </div>
      </main>
    </SoloShellLayout>
  );
}
