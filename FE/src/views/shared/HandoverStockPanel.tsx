'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { StockItem, WarehouseLocation } from '@/models/inventory.model';
import { LoadingGrid } from '@/views/inventory/inventory-ui';

/** Tồn tại kho con — bàn giao ca sau (không bắt hoàn trả) */
export function HandoverStockPanel({ stockHref }: { stockHref: string }) {
  const { version } = useActiveBranch();
  const { warehouses: branchWarehouses } = useBranchWarehouses();
  const [rows, setRows] = useState<
    { wh: WarehouseLocation; items: StockItem[]; low: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sub = branchWarehouses.filter((w) => !w.isCentralWarehouse);
      const data = await Promise.all(
        sub.map(async (wh) => {
          const items = await InventoryController.getStock(wh.id);
          return {
            wh,
            items: items.filter((i) => i.currentStock > 0),
            low: items.filter((i) => i.isLow).length,
          };
        }),
      );
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [branchWarehouses, version]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingGrid />;

  const totalSkus = rows.reduce((s, r) => s + r.items.length, 0);

  return (
    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
            <span>🤝</span> Tồn ca — bàn giao ca sau
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {totalSkus} mặt hàng đang ở kho con · không cần hoàn trả cuối ca
          </p>
        </div>
        <Link
          href={stockHref}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Chi tiết tồn →
        </Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {rows.map(({ wh, items, low }) => (
          <div
            key={wh.id}
            className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm"
          >
            <p className="font-semibold text-stone-900">
              {wh.code}
              <span className="ml-2 text-xs font-normal text-stone-500">{wh.name}</span>
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {items.length} NL có tồn
              {low > 0 && (
                <span className="ml-2 font-medium text-amber-700">· {low} thấp</span>
              )}
            </p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-stone-700">
              {items.slice(0, 8).map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="truncate">{i.name}</span>
                  <span className="shrink-0 font-medium">
                    {i.displayStock}
                    {i.displayUnit}
                  </span>
                </li>
              ))}
              {items.length > 8 && (
                <li className="text-stone-400">+{items.length - 8} mặt hàng khác…</li>
              )}
              {!items.length && (
                <li className="text-stone-400">Chưa có tồn — cấp phát đầu ca</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {!branchWarehouses.length && (
        <p className="mt-3 text-sm text-stone-500">Chưa cấu hình kho con.</p>
      )}
    </section>
  );
}
