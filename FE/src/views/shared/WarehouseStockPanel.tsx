'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { usePolling } from '@/lib/use-polling';
import { useActiveBranch } from '@/lib/use-active-branch';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { StockItem } from '@/models/inventory.model';
import {
  EmptyState,
  InventoryPageHeader,
  LoadingGrid,
  StockCardGrid,
  WarehouseSelector,
  type InventoryTheme,
} from '@/views/inventory/inventory-ui';

const POLL_MS = 12_000;

export function WarehouseStockPanel({
  title,
  theme = 'warehouse',
}: {
  title?: string;
  theme?: InventoryTheme;
}) {
  const { branchId, version } = useActiveBranch();
  const { warehouses, centralId } = useBranchWarehouses();
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    setWarehouseId(centralId ?? warehouses[0]?.id ?? '');
  }, [centralId, warehouses, branchId, version]);

  const load = useCallback(async () => {
    if (!warehouseId) return;
    try {
      const data = await InventoryController.getStock(warehouseId);
      setItems(data);
      setLastSync(new Date());
      setError('');
    } catch {
      setError('Không tải được tồn kho');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, version]);

  usePolling(load, POLL_MS, !!warehouseId);

  const selected = warehouses.find((w) => w.id === warehouseId);
  const lowCount = useMemo(() => items.filter((i) => i.isLow).length, [items]);

  return (
    <div className="space-y-6">
      <InventoryPageHeader
        theme={theme}
        badge="Tồn kho"
        title={title ?? 'Theo dõi tồn realtime'}
        subtitle={
          selected
            ? `${selected.name}${selected.isKitchenSource ? ' · Bếp trừ kho khi đơn READY' : selected.isCentralWarehouse ? ' · Nguồn nhập NCC' : ' · Nhận hàng qua phiếu đã duyệt'}`
            : lastSync
              ? `Cập nhật ${lastSync.toLocaleTimeString('vi-VN')}`
              : undefined
        }
      />

      {warehouses.length > 0 && (
        <WarehouseSelector
          theme={theme}
          warehouses={warehouses}
          selectedId={warehouseId}
          onSelect={(id) => {
            setLoading(true);
            setWarehouseId(id);
          }}
        />
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading && items.length === 0 ? (
        <LoadingGrid />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Chưa có tồn kho"
          description="Chọn kho khác hoặc nhập NCC / cấp phát để có dữ liệu."
        />
      ) : (
        <>
          {lowCount > 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
              ⚠️ <strong>{lowCount}</strong> mặt hàng dưới mức tối thiểu
            </p>
          )}
          <StockCardGrid items={items} />
        </>
      )}
    </div>
  );
}
