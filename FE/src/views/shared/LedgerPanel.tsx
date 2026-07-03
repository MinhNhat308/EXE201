'use client';

import { useCallback, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { formatCurrency } from '@/lib/format';
import { SupplierReceipt } from '@/models/inventory.model';
import {
  STOCK_REQUEST_TYPE_LABELS,
  StockTransferRequest,
} from '@/models/stock-request.model';
import { StatCard, EmptyState } from '@/views/inventory/inventory-ui';
import { SupplierReceiptList } from '@/views/shared/SupplierReceiptList';

export function LedgerPanel() {
  const { branchId, version } = useActiveBranch();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [receipts, setReceipts] = useState<SupplierReceipt[]>([]);
  const [requests, setRequests] = useState<StockTransferRequest[]>([]);
  const [summary, setSummary] = useState({
    supplierReceiptCount: 0,
    completedRequestCount: 0,
    supplierReceiptTotalValue: 0,
  });

  const load = useCallback(async () => {
    const data = await InventoryController.getLedger(month, branchId, true);
    setReceipts(data.supplierReceipts);
    setRequests(data.stockRequests);
    setSummary(data.summary);
  }, [month, branchId, version]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
          <span className="text-2xl">📅</span>
          Tháng sao kê
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-2 font-normal"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Phiếu NCC (kho tổng)"
          value={summary.supplierReceiptCount}
          icon="📥"
          tone="info"
        />
        <StatCard
          label="Giá trị nhập NCC"
          value={formatCurrency(summary.supplierReceiptTotalValue ?? 0)}
          icon="💰"
          tone="info"
        />
        <StatCard
          label="Phiếu chuyển kho đã duyệt"
          value={summary.completedRequestCount}
          icon="✅"
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-stone-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm">
              📥
            </span>
            Nhập nhà cung cấp
          </h2>
          <SupplierReceiptList
            receipts={receipts}
            emptyTitle="Không có phiếu NCC trong tháng"
            emptyHint=""
          />
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-stone-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm">
              📋
            </span>
            Phiếu xin nhập/xuất (hoàn tất)
          </h2>
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm"
              >
                <p className="font-mono font-bold text-stone-900">{r.requestNumber}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {STOCK_REQUEST_TYPE_LABELS[r.type]}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  {r.fromWarehouseCode} → {r.toWarehouseCode} · CT {r.permitDocumentNumber}
                </p>
              </div>
            ))}
            {!requests.length && (
              <EmptyState icon="📋" title="Không có phiếu hoàn tất trong tháng" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
