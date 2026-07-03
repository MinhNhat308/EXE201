'use client';

import { useCallback, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { DailyUsage } from '@/models/inventory.model';
import {
  EmptyState,
  InventoryPageHeader,
  LoadingGrid,
  WarehouseSelector,
} from '@/views/inventory/inventory-ui';
import { WarehouseLayout } from './WarehouseLayout';

export function DailyUsageView() {
  const { warehouses, kitchenId, version } = useBranchWarehouses();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [warehouseId, setWarehouseId] = useState('');
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setWarehouseId(kitchenId ?? warehouses[0]?.id ?? '');
  }, [kitchenId, warehouses, version]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await InventoryController.getDailyUsage(
        date,
        warehouseId || undefined,
      );
      setUsage(data);
      setError('');
    } catch {
      setError('Không tải được dữ liệu sử dụng');
    } finally {
      setLoading(false);
    }
  }, [date, warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  const whList = warehouses.map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    sortOrder: 0,
    isActive: true,
    isKitchenSource: !!w.isKitchenSource,
    isCentralWarehouse: false,
  }));

  return (
    <WarehouseLayout>
      <div className="space-y-6">
        <InventoryPageHeader
          theme="warehouse"
          badge="Tiêu hao"
          title="Sử dụng nguyên liệu theo ngày"
          subtitle="Tổng hợp xuất kho từ đơn bếp đã READY — trừ theo công thức tại kho bếp (KHO1)."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border-0 bg-white/20 px-4 py-2 text-sm text-white backdrop-blur placeholder:text-white/60"
            />
          </div>
        </InventoryPageHeader>

        {warehouses.length > 0 && (
          <WarehouseSelector
            theme="warehouse"
            warehouses={whList}
            selectedId={warehouseId}
            onSelect={setWarehouseId}
          />
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <LoadingGrid />
        ) : usage ? (
          <>
            <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-stone-500">
                {usage.movementCount} lần xuất ·{' '}
                <strong className="text-stone-800">
                  {new Date(usage.date).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </strong>
              </p>
            </div>

            {usage.items.length === 0 ? (
              <EmptyState
                icon="📊"
                title="Không có xuất kho trong ngày này"
                description="Chưa có đơn bếp hoàn thành hoặc chưa có công thức món"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {usage.items.map((row) => (
                  <div
                    key={row.ingredientId}
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm"
                  >
                    <span className="text-2xl">📤</span>
                    <h3 className="mt-2 font-bold text-stone-900">{row.name}</h3>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">
                      {row.totalUsed.toLocaleString('vi-VN')}
                      <span className="ml-1 text-base font-medium text-stone-600">
                        {row.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </WarehouseLayout>
  );
}
