'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  getStoredPlan,
  getStoredSubscription,
  getStoredTenant,
  getSubscriptionStatus,
} from '@/lib/auth-storage';
import { planHasFeature } from '@/lib/plan-features';
import {
  isChainOperatingPlan,
  isSoloOperatingPlan,
  isStoreOperatingPlan,
  STORE_CHECK_IN_PATH,
  STORE_CASHIER_POS_PATH,
  STORE_KITCHEN_ORDERS_PATH,
  STORE_MANAGER_SHIFTS_PATH,
  STORE_ACCOUNTING_SHIFTS_PATH,
  STORE_SERVER_PATH,
  STORE_SETTINGS_PATH,
  STORE_REPORTS_PATH,
} from '@/lib/workspace-routes';
import { SaasFeature } from '@/models/saas-feature.model';
import { SubscriptionPlan, TenantInfo } from '@/models/tenant.model';
import { SEGMENT_BY_PLAN } from '@/lib/segments';
import { PlanCallout } from '@/views/components/app-ui';
import { SubscriptionCard } from '@/views/subscription/SubscriptionCard';
import { AdminLayout } from './AdminLayout';

type ActionCard = {
  href: string;
  title: string;
  desc: string;
  feature?: SaasFeature;
};

const STORE_QUICK: ActionCard[] = [
  {
    href: STORE_CHECK_IN_PATH,
    title: 'Check-in ca',
    desc: 'NV STAFF / Bếp chọn ca làm',
    feature: SaasFeature.SHIFT_MGMT,
  },
  {
    href: STORE_CASHIER_POS_PATH,
    title: 'Mở POS thu ngân',
    desc: 'Bán hàng, thanh toán, in hóa đơn',
    feature: SaasFeature.POS,
  },
  {
    href: STORE_KITCHEN_ORDERS_PATH,
    title: 'Màn hình bếp',
    desc: 'KDS — PENDING → READY',
    feature: SaasFeature.KITCHEN,
  },
  {
    href: STORE_REPORTS_PATH,
    title: 'Báo cáo doanh thu',
    desc: 'Đơn, doanh thu, món bán chạy',
    feature: SaasFeature.BASIC_REPORTS,
  },
  {
    href: STORE_SETTINGS_PATH,
    title: 'Cài đặt quán',
    desc: 'Tên quán, QR, đường/đá, kho',
    feature: SaasFeature.STORE_SETTINGS,
  },
  {
    href: STORE_MANAGER_SHIFTS_PATH,
    title: 'Quản lý ca',
    desc: 'Theo dõi ca & đơn hôm nay',
    feature: SaasFeature.SHIFT_MGMT,
  },
];

const CHAIN_QUICK: ActionCard[] = [
  {
    href: '/dashboard/admin/branches',
    title: 'Chi nhánh',
    desc: '4 CN — chuyển xem từng quán',
    feature: SaasFeature.MULTI_BRANCH,
  },
  {
    href: '/dashboard/admin/chain-reports',
    title: 'Tổng hợp chuỗi',
    desc: 'Doanh thu tất cả chi nhánh',
    feature: SaasFeature.MULTI_BRANCH,
  },
  {
    href: '/dashboard/admin/reports',
    title: 'Báo cáo chi nhánh',
    desc: 'Chi tiết theo CN đang chọn',
    feature: SaasFeature.BASIC_REPORTS,
  },
  {
    href: '/dashboard/staff/cashier',
    title: 'Mở POS thu ngân',
    desc: 'Bán hàng, thanh toán, in hóa đơn',
    feature: SaasFeature.POS,
  },
  {
    href: '/dashboard/kitchen/orders',
    title: 'Màn hình bếp',
    desc: 'Xử lý đơn PENDING → READY',
    feature: SaasFeature.KITCHEN,
  },
];

const STORE_SECTIONS: { title: string; cards: ActionCard[] }[] = [
  {
    title: 'Vận hành trong ngày',
    cards: [
      {
        href: STORE_CHECK_IN_PATH,
        title: 'Check-in ca',
        desc: 'NV STAFF / Bếp chọn ca',
        feature: SaasFeature.SHIFT_MGMT,
      },
      {
        href: STORE_CASHIER_POS_PATH,
        title: 'Thu ngân POS',
        desc: 'Bán hàng & thanh toán',
        feature: SaasFeature.POS,
      },
      {
        href: STORE_SERVER_PATH,
        title: 'Phục vụ',
        desc: 'Giao món READY → COMPLETED',
        feature: SaasFeature.POS,
      },
      {
        href: STORE_KITCHEN_ORDERS_PATH,
        title: 'Bếp KDS',
        desc: 'Kanban chế biến đơn',
        feature: SaasFeature.KITCHEN,
      },
    ],
  },
  {
    title: 'Vận hành cửa hàng',
    cards: [
      {
        href: STORE_MANAGER_SHIFTS_PATH,
        title: 'Quản lý ca NV',
        desc: 'QL ca & kế toán theo dõi ca làm',
        feature: SaasFeature.SHIFT_MGMT,
      },
      {
        href: '/dashboard/manager/orders',
        title: 'Đơn hàng ca',
        desc: 'Theo dõi trạng thái đơn',
        feature: SaasFeature.SHIFT_MGMT,
      },
      {
        href: '/dashboard/manager/issue',
        title: 'Cấp phát ca',
        desc: 'Xuất kho đầu ca',
        feature: SaasFeature.SHIFT_MGMT,
      },
      {
        href: '/dashboard/manager/returns',
        title: 'Hoàn trả ca',
        desc: 'Thu hồi cuối ca',
        feature: SaasFeature.SHIFT_MGMT,
      },
    ],
  },
  {
    title: 'Kho & kế toán',
    cards: [
      {
        href: STORE_ACCOUNTING_SHIFTS_PATH,
        title: 'Ca & vận hành (KT)',
        desc: 'Kế toán theo dõi ca nhân viên',
        feature: SaasFeature.ACCOUNTING,
      },
      {
        href: '/dashboard/accounting/supplier',
        title: 'Nhập NCC',
        desc: 'Vào kho tổng',
        feature: SaasFeature.ACCOUNTING,
      },
      {
        href: '/dashboard/accounting/stock',
        title: 'Tồn kho',
        desc: 'Kế toán quản lý kho Store',
        feature: SaasFeature.ACCOUNTING,
      },
      {
        href: '/dashboard/admin/recipes',
        title: 'Công thức',
        desc: 'Định lượng món',
        feature: SaasFeature.RECIPE,
      },
    ],
  },
  {
    title: 'Cấu hình & nhân sự',
    cards: [
      {
        href: STORE_SETTINGS_PATH,
        title: 'Cài đặt quán',
        desc: 'Tên, QR, POS đường/đá',
        feature: SaasFeature.STORE_SETTINGS,
      },
      {
        href: STORE_REPORTS_PATH,
        title: 'Báo cáo doanh thu',
        desc: 'Thống kê theo ca',
        feature: SaasFeature.BASIC_REPORTS,
      },
      {
        href: '/dashboard/admin/menu',
        title: 'Menu',
        desc: 'Món và giá bán',
        feature: SaasFeature.MENU,
      },
      {
        href: '/dashboard/admin/employees',
        title: 'Nhân viên',
        desc: 'Username, mật khẩu & vai trò',
        feature: SaasFeature.EMPLOYEES,
      },
      {
        href: '/dashboard/admin/warehouses',
        title: 'Cấu hình kho',
        desc: 'KHO_TONG, KHO1–3',
        feature: SaasFeature.WAREHOUSE,
      },
      { href: '/dashboard/admin/subscription', title: 'Gói BOBAPOS', desc: 'Solo / Store / Chain' },
    ],
  },
];

const CHAIN_SECTIONS: { title: string; cards: ActionCard[] }[] = [
  {
    title: 'Vận hành hàng ngày',
    cards: [
      {
        href: '/dashboard/check-in',
        title: 'Check-in ca',
        desc: 'NV STAFF / Bếp chọn ca',
        feature: SaasFeature.SHIFT_MGMT,
      },
      {
        href: '/dashboard/staff/cashier',
        title: 'Thu ngân',
        desc: 'POS bán hàng',
        feature: SaasFeature.POS,
      },
      {
        href: '/dashboard/staff/server',
        title: 'Phục vụ',
        desc: 'Giao món READY',
        feature: SaasFeature.POS,
      },
      {
        href: '/dashboard/kitchen/orders',
        title: 'Bếp KDS',
        desc: 'Chế biến đơn',
        feature: SaasFeature.KITCHEN,
      },
    ],
  },
  {
    title: 'Kho & kế toán',
    cards: [
      {
        href: '/dashboard/warehouse/stock',
        title: 'Tồn kho đa CN',
        desc: 'Theo chi nhánh & kho',
        feature: SaasFeature.WAREHOUSE,
      },
      {
        href: '/dashboard/accounting/supplier',
        title: 'Nhập NCC',
        desc: 'KHO_TONG từng chi nhánh',
        feature: SaasFeature.ACCOUNTING,
      },
      {
        href: '/dashboard/accounting/requests',
        title: 'Duyệt phiếu',
        desc: 'Cấp phát / bổ sung',
        feature: SaasFeature.ACCOUNTING,
      },
      {
        href: '/dashboard/accounting/reports',
        title: 'Báo cáo kế toán',
        desc: 'Doanh thu & kho',
        feature: SaasFeature.BASIC_REPORTS,
      },
    ],
  },
  {
    title: 'Quản lý chuỗi',
    cards: [
      {
        href: '/dashboard/admin/branches',
        title: 'Chi nhánh',
        desc: 'MAIN + CN-Q1/Q7/TD',
        feature: SaasFeature.MULTI_BRANCH,
      },
      {
        href: '/dashboard/admin/chain-reports',
        title: 'So sánh CN',
        desc: 'Doanh thu tập trung',
        feature: SaasFeature.MULTI_BRANCH,
      },
      {
        href: '/dashboard/manager/orders',
        title: 'Đơn theo ca',
        desc: 'Theo dõi vận hành',
        feature: SaasFeature.SHIFT_MGMT,
      },
    ],
  },
  {
    title: 'Cấu hình & nhân sự',
    cards: [
      {
        href: '/dashboard/admin/menu',
        title: 'Menu',
        desc: 'Món và giá bán',
        feature: SaasFeature.MENU,
      },
      {
        href: '/dashboard/admin/employees',
        title: 'Nhân viên',
        desc: 'Tài khoản & phân quyền',
        feature: SaasFeature.EMPLOYEES,
      },
      { href: '/dashboard/admin/subscription', title: 'Gói BOBAPOS', desc: 'Solo / Store / Chain' },
    ],
  },
];

function filterCards(cards: ActionCard[], plan: string, status: string) {
  return cards.filter((c) => !c.feature || planHasFeature(plan, status, c.feature));
}

export function AdminHomeView() {
  const sub = getStoredSubscription<{ plan?: string }>();
  const tenant = getStoredTenant<TenantInfo>();
  const plan = getStoredPlan() ?? sub?.plan ?? SubscriptionPlan.STANDARD;
  const status = getSubscriptionStatus() ?? 'ACTIVE';
  const storePlan = isStoreOperatingPlan(tenant, plan);
  const soloPlan = isSoloOperatingPlan(tenant, plan);
  const chainPlan = isChainOperatingPlan(tenant, plan);

  const quickActions = useMemo(
    () => filterCards(storePlan ? STORE_QUICK : CHAIN_QUICK, plan, status),
    [plan, status, storePlan],
  );

  const sections = useMemo(
    () =>
      (storePlan ? STORE_SECTIONS : CHAIN_SECTIONS)
        .map((s) => ({
          ...s,
          cards: filterCards(s.cards, plan, status),
        }))
        .filter((s) => s.cards.length > 0),
    [plan, status, storePlan],
  );

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        {chainPlan && (
          <PlanCallout segment={SEGMENT_BY_PLAN[SubscriptionPlan.PREMIUM]} title="Chuỗi demo · 4 chi nhánh">
            Dùng dropdown <strong>Chi nhánh đang xem</strong> ở sidebar để xem kho, báo cáo CN và đơn
            ca theo từng cửa hàng. Mã NV: <span className="font-mono font-semibold">{tenant?.slug}</span>
          </PlanCallout>
        )}

        {storePlan && tenant?.slug && (
          <PlanCallout segment={SEGMENT_BY_PLAN[SubscriptionPlan.STANDARD]} title="Mã cửa hàng cho nhân viên">
            <span className="font-mono text-lg font-bold">{tenant.slug}</span>
            <p className="mt-2">
              NV đăng nhập bằng username + mã cửa hàng. STAFF chọn Thu ngân/Phục vụ khi check-in ca;
              Bếp vào thẳng màn KDS sau check-in.
            </p>
          </PlanCallout>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          {storePlan ? 'Hub cửa hàng Store' : soloPlan ? 'Cài đặt' : 'Xin chào, chủ cửa hàng'}
        </h1>
        <p className="mt-1 text-stone-500">
          {storePlan
            ? 'Quản trị nhân sự, ca làm, menu và kho — nhân viên có màn làm việc riêng sau khi đăng nhập.'
            : soloPlan
              ? 'Gói Solo — dùng Hub Solo để bán hàng hàng ngày.'
              : 'BOBAPOS Chain — quản trị chuỗi, nhân sự và báo cáo tập trung.'}
        </p>

        {quickActions.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#2F80ED]/30 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <h3 className="font-semibold text-stone-900 group-hover:text-[#2F80ED]">{a.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{a.desc}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6">
          <SubscriptionCard />
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {section.title}
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.cards.map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition duration-200 hover:border-[#2F80ED]/25 hover:shadow-md"
                  >
                    <h3 className="font-semibold text-stone-800">{card.title}</h3>
                    <p className="mt-1 text-sm text-stone-500">{card.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
