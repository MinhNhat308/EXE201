'use client';



import Link from 'next/link';

import { BRAND } from '@/lib/brand';

import {

  InventoryPageHeader,

  ModuleCard,

  WorkflowSteps,

} from '@/views/inventory/inventory-ui';

import { HandoverStockPanel } from '@/views/shared/HandoverStockPanel';
import { OperationsDashboardPanel } from '@/views/shared/OperationsDashboardPanel';

import { ManagerLayout } from './ManagerLayout';



const MODULES = [
  {
    href: '/dashboard/manager/issue',
    title: 'Cấp phát đầu ca',
    desc: 'Xin NL từ kho tổng — có PXK',
    icon: '📤',
  },
  {
    href: '/dashboard/manager/replenish',
    title: 'Bổ sung tồn kho lẻ',
    desc: 'KHO_TONG → KHO1/2/3',
    icon: '🔄',
  },
  {
    href: '/dashboard/manager/returns',
    title: 'Thu hồi về kho tổng',
    desc: 'Tuỳ chọn — khi cần đưa NL về KHO_TONG',
    icon: '📥',
  },
  {
    href: '/dashboard/manager/orders',
    title: 'Đơn hàng hôm nay',
    desc: 'Theo dõi thu ngân & bếp',
    icon: '🧾',
  },
  {
    href: '/dashboard/manager/reports',
    title: 'Báo cáo doanh thu',
    desc: 'Doanh thu, món bán chạy, kho',
    icon: '📊',
  },
  {
    href: '/dashboard/manager/stock',
    title: 'Tồn kho',
    desc: 'KHO1 bếp · KHO2 · KHO3',
    icon: '📦',
  },
];



export function ManagerHomeView() {

  return (

    <ManagerLayout>

      <div className="space-y-6">

        <InventoryPageHeader

          theme="warehouse"

          badge="Quản lý cửa hàng"

          title="Vận hành cửa hàng"

          subtitle="Luồng ca: cấp phát đầu ca → bán hàng / bếp → tồn giữ tại kho con. Kế toán duyệt mới cập nhật tồn."

        />



        <OperationsDashboardPanel
          warehouseHref="/dashboard/manager/returns"
          accountingHref="/dashboard/accounting/requests"
        />

        <HandoverStockPanel stockHref="/dashboard/manager/stock" />

        <WorkflowSteps theme="warehouse" />

        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((m) => (
            <ModuleCard key={m.href} theme="warehouse" {...m} />
          ))}

        </div>



        <div className={`rounded-xl border ${BRAND.primarySoft} p-4 text-sm`}>

          <p className="font-semibold">Chốt ca nhanh</p>

          <p className="mt-1 text-stone-600">
            Phần nguyên liệu chưa dùng <strong>giữ tại kho con</strong> — ca sau tiếp tục xài.
            Chỉ thu hồi về kho tổng khi thực sự cần.
          </p>

          <Link
            href="/dashboard/manager/stock"
            className={`mt-3 inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white ${BRAND.primary}`}
          >
            Xem tồn ca →
          </Link>

        </div>

      </div>

    </ManagerLayout>

  );

}


