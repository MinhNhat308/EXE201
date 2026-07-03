'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePolling } from '@/lib/use-polling';
import { BRAND } from '@/lib/brand';
import { formatCurrency } from '@/lib/format';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { WarehouseOverview } from '@/models/inventory.model';
import { StockRequestStatus } from '@/models/stock-request.model';
import {
  InventoryPageHeader,
  LoadingGrid,
  ModuleCard,
  StatCard,
  WarehouseSelector,
  WorkflowSteps,
} from '@/views/inventory/inventory-ui';
import { OperationsDashboardPanel } from '@/views/shared/OperationsDashboardPanel';
import { AccountingLayout } from './AccountingLayout';

const MODULES = [
  {
    href: '/dashboard/accounting/reports',
    title: 'Trung tâm báo cáo',
    desc: 'Doanh thu, HĐĐT, kho — xem & in báo cáo',
    icon: '📊',
  },
  {
    href: '/dashboard/accounting/supplier',
    title: 'Nhập NCC → Kho tổng',
    desc: 'Hóa đơn nhà cung cấp, cộng tồn KHO_TONG',
    icon: '🏭',
  },
  {
    href: '/dashboard/accounting/requests',
    title: 'Duyệt phiếu kho',
    desc: 'Cấp phát & hoàn trả trong ngày',
    icon: '✅',
  },
  {
    href: '/dashboard/accounting/returns',
    title: 'Danh sách hoàn trả',
    desc: 'Đối chiếu mã phiếu gốc',
    icon: '📋',
  },
  {
    href: '/dashboard/accounting/stock',
    title: 'Tồn theo kho',
    desc: 'Card grid KHO_TONG, KHO1, 2, 3',
    icon: '📦',
  },
  {
    href: '/dashboard/accounting/ledger',
    title: 'Sao kê tháng',
    desc: 'NCC + phiếu đã hoàn tất',
    icon: '📑',
  },
];

export function AccountingHomeView() {
  const { branchId, version } = useActiveBranch();
  const { centralId } = useBranchWarehouses();
  const [overview, setOverview] = useState<WarehouseOverview | null>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (centralId) setWarehouseId(centralId);
  }, [centralId, branchId, version]);

  const loadOverview = useCallback(async () => {
    try {
      const data = await InventoryController.getOverview(
        warehouseId || undefined,
        branchId,
        true,
      );
      setOverview(data);
      if (!warehouseId && data.warehouseId) setWarehouseId(data.warehouseId);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [warehouseId, branchId, version]);

  const loadPending = useCallback(async () => {
    try {
      const pending = await InventoryController.getStockRequests(
        {
          status: StockRequestStatus.PENDING,
          branchId,
        },
        true,
      );
      setPendingCount(pending.length);
    } catch {
      /* ignore */
    }
  }, [branchId, version]);

  useEffect(() => {
    setLoading(true);
    void loadOverview();
    void loadPending();
  }, [loadOverview, loadPending]);

  usePolling(loadOverview, 15_000);
  usePolling(loadPending, 30_000);

  const central = overview?.warehouses.find((w) => w.isCentralWarehouse);

  return (
    <AccountingLayout>
      <div className="space-y-6">
        <InventoryPageHeader
          theme="accounting"
          badge="Dashboard kế toán"
          title="Kê khai & đối chiếu kho"
          subtitle="Nhập NCC chỉ vào kho tổng. Duyệt phiếu xin chuyển trước khi tồn thay đổi tại kho con."
        />

        <WorkflowSteps theme="accounting" />

        <div className="flex flex-col gap-3 rounded-2xl border border-[#2F80ED]/25 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2F80ED]">
              Báo cáo quản trị
            </p>
            <p className="mt-1 text-lg font-bold text-stone-900">
              Xem báo cáo doanh thu, thuế & kho
            </p>
            <p className="mt-0.5 text-sm text-stone-500">
              Mẫu báo cáo chuẩn — in PDF hoặc xuất Excel
            </p>
          </div>
          <Link
            href="/dashboard/accounting/reports"
            className={`shrink-0 rounded-xl px-6 py-3 text-center text-sm font-semibold text-white shadow-md ${BRAND.primary}`}
          >
            👁 Xem báo cáo →
          </Link>
        </div>

        <OperationsDashboardPanel
          warehouseHref="/dashboard/warehouse/returns"
          accountingHref="/dashboard/accounting/requests"
        />

        {pendingCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm">
            <span className="text-3xl">🔔</span>
            <div className="flex-1">
              <p className="font-bold text-amber-900">
                {pendingCount} phiếu đang chờ duyệt
              </p>
              <p className="text-sm text-amber-800/80">
                Vào mục Duyệt phiếu để xác nhận chứng từ xin phép
              </p>
            </div>
            <Link
              href="/dashboard/accounting/requests"
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md ${BRAND.primary}`}
            >
              Duyệt ngay →
            </Link>
          </div>
        )}

        {overview?.warehouses && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-600">
              Tồn theo kho
            </h2>
            <WarehouseSelector
              theme="accounting"
              warehouses={overview.warehouses}
              selectedId={warehouseId}
              onSelect={setWarehouseId}
            />
            {central && warehouseId === central.id && (
              <p className="mt-2 text-sm text-violet-700">
                🏭 Đang xem <strong>KHO_TONG</strong> — nguồn nhập NCC và xuất cho kho con
              </p>
            )}
          </section>
        )}

        {loading && !overview ? (
          <LoadingGrid />
        ) : overview ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard
                label="Tồn thấp (kho đang chọn)"
                value={overview.lowCount}
                icon="⚠️"
                tone="warning"
              />
              <StatCard label="Chất lỏng sắp hết" value={overview.liquidLow} icon="💧" tone="info" />
              <StatCard
                label="Xuất bếp hôm nay"
                value={overview.todayUsageLines}
                icon="👨‍🍳"
                hint="KHO1 khi bếp READY"
              />
              <StatCard label="Phiếu NCC hôm nay" value={overview.todayReceiptCount} icon="📥" />
              <StatCard
                label="Giá trị NCC hôm nay"
                value={formatCurrency(overview.todayReceiptValue ?? 0)}
                icon="💰"
                tone="info"
              />
              <StatCard
                label="NCC tháng này"
                value={formatCurrency(overview.monthReceiptValue ?? 0)}
                icon="📊"
                hint={`${overview.monthReceiptCount ?? 0} phiếu`}
              />
            </div>
          </>
        ) : null}
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-stone-600">
            Nghiệp vụ
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => (
              <ModuleCard
                key={m.href}
                theme="accounting"
                {...m}
                stat={
                  m.href.includes('requests') && pendingCount > 0
                    ? `${pendingCount} chờ`
                    : m.href.includes('supplier') && overview
                      ? formatCurrency(overview.todayReceiptValue ?? 0)
                      : undefined
                }
              />
            ))}
          </div>
        </section>
      </div>
    </AccountingLayout>
  );
}
