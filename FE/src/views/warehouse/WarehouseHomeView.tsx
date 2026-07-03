'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePolling } from '@/lib/use-polling';
import { formatCurrency } from '@/lib/format';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { WarehouseOverview } from '@/models/inventory.model';
import {
  CATEGORY_ORDER,
  INGREDIENT_CATEGORY_LABELS,
} from '@/models/ingredient-category.model';
import { StockRequestStatus } from '@/models/stock-request.model';
import {
  IngredientStockCard,
  InventoryPageHeader,
  LoadingGrid,
  ModuleCard,
  StatCard,
  WarehouseSelector,
  WorkflowSteps,
  categoryIcon,
} from '@/views/inventory/inventory-ui';
import { OperationsDashboardPanel } from '@/views/shared/OperationsDashboardPanel';
import { WarehouseLayout } from './WarehouseLayout';

const MODULES = [
  {
    href: '/dashboard/warehouse/replenish',
    title: 'Bổ sung tồn kho lẻ',
    desc: 'KHO_TONG → KHO1/2/3 (không gắn ca)',
    icon: '🔄',
  },
  {
    href: '/dashboard/warehouse/requests',
    title: 'Danh sách phiếu',
    desc: 'Theo dõi trạng thái duyệt',
    icon: '📋',
  },
  {
    href: '/dashboard/warehouse/stock',
    title: 'Tồn kho realtime',
    desc: 'Card grid theo nhóm',
    icon: '📦',
  },
  {
    href: '/dashboard/warehouse/usage',
    title: 'Tiêu hao theo ngày',
    desc: 'Tổng hợp xuất kho từ đơn bếp READY',
    icon: '📊',
  },
];

export function WarehouseHomeView() {
  const { branchId, version } = useActiveBranch();
  const { warehouses, kitchenId, centralId } = useBranchWarehouses();
  const [overview, setOverview] = useState<WarehouseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setWarehouseId(kitchenId ?? centralId ?? '');
  }, [kitchenId, centralId, branchId, version]);

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

  const lowItems =
    overview &&
    CATEGORY_ORDER.flatMap((cat) => overview.byCategory[cat] ?? []).filter((i) => i.isLow);

  return (
    <WarehouseLayout>
      <div className="space-y-6">
        <InventoryPageHeader
          theme="warehouse"
          badge="Dashboard kho"
          title="Trung tâm điều phối kho"
          subtitle="Theo dõi tồn đa kho, phiếu xin chuyển và tiêu hao bếp. Chất lỏng quản lý theo ml (hiển thị L khi ≥ 1.000ml)."
        />

        <WorkflowSteps theme="warehouse" />

        <OperationsDashboardPanel
          warehouseHref="/dashboard/warehouse/returns"
          accountingHref="/dashboard/accounting/requests"
        />

        {overview?.warehouses && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-600">
              Chọn kho xem nhanh
            </h2>
            <WarehouseSelector
              theme="warehouse"
              warehouses={overview.warehouses}
              selectedId={warehouseId}
              onSelect={(id) => {
                setLoading(true);
                setWarehouseId(id);
              }}
            />
          </section>
        )}

        {loading && !overview ? (
          <LoadingGrid />
        ) : overview ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard
                label="Cảnh báo tồn thấp"
                value={overview.lowCount}
                icon="⚠️"
                tone="warning"
                hint="So với mức tối thiểu"
              />
              <StatCard
                label="Chất lỏng sắp hết"
                value={overview.liquidLow}
                icon="💧"
                tone="info"
              />
              <StatCard
                label="Xuất kho hôm nay"
                value={overview.todayUsageLines}
                icon="📤"
                hint="Lần trừ từ bếp"
              />
              <StatCard
                label="Phiếu NCC hôm nay"
                value={overview.todayReceiptCount}
                icon="📥"
              />
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

            {lowItems && lowItems.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700">
                    Cần nhập gấp ({lowItems.length})
                  </h2>
                  <Link
                    href="/dashboard/warehouse/requests"
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Lập phiếu xin →
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {lowItems.slice(0, 6).map((item) => (
                    <IngredientStockCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {CATEGORY_ORDER.map((cat) => {
              const items = overview.byCategory[cat] ?? [];
              if (!items.length) return null;
              return (
                <section key={cat}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-700">
                    <span>{categoryIcon(cat)}</span>
                    {INGREDIENT_CATEGORY_LABELS[cat]}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {items.slice(0, 4).map((ing) => (
                      <IngredientStockCard key={ing.id} item={ing} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : null}

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-stone-600">
            Chức năng
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <ModuleCard
                key={m.href}
                theme="warehouse"
                {...m}
                stat={m.href.includes('requests') && pendingCount > 0 ? `${pendingCount} chờ KT` : undefined}
              />
            ))}
          </div>
        </section>
      </div>
    </WarehouseLayout>
  );
}
