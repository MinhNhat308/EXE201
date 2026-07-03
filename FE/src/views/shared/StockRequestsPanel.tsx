'use client';

import { useCallback, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import {
  STOCK_REQUEST_STATUS_LABELS,
  STOCK_REQUEST_TYPE_LABELS,
  StockRequestStatus,
  StockTransferRequest,
} from '@/models/stock-request.model';
import { EmptyState, type InventoryTheme } from '@/views/inventory/inventory-ui';

const STATUS_STYLES: Record<StockRequestStatus, string> = {
  [StockRequestStatus.PENDING]: 'bg-amber-100 text-amber-900 border-amber-200',
  [StockRequestStatus.APPROVED]: 'bg-sky-100 text-sky-900 border-sky-200',
  [StockRequestStatus.COMPLETED]: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  [StockRequestStatus.REJECTED]: 'bg-red-100 text-red-900 border-red-200',
  [StockRequestStatus.DRAFT]: 'bg-stone-100 text-stone-700 border-stone-200',
};

export function StockRequestsPanel({ theme = 'accounting' }: { theme?: InventoryTheme }) {
  const { branchId, version } = useActiveBranch();
  const [requests, setRequests] = useState<StockTransferRequest[]>([]);
  const [filter, setFilter] = useState<StockRequestStatus | 'ALL'>(
    StockRequestStatus.PENDING,
  );
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { note: string; reject: string }>>({});

  const accentBtn = 'bg-blue-600 hover:bg-blue-700';
  const filterActive = 'bg-blue-600 text-white shadow-md';

  const load = useCallback(async () => {
    const data = await InventoryController.getStockRequests(
      filter === 'ALL' ? { branchId } : { status: filter, branchId },
      true,
    );
    setRequests(data);
  }, [filter, branchId, version]);

  useEffect(() => {
    load();
  }, [load]);

  const getDraft = (id: string) => drafts[id] ?? { note: '', reject: '' };
  const setDraft = (id: string, patch: Partial<{ note: string; reject: string }>) => {
    setDrafts((d) => ({ ...d, [id]: { ...getDraft(id), ...patch } }));
  };

  const review = async (id: string, approved: boolean) => {
    const { note, reject } = getDraft(id);
    setReviewing(id);
    try {
      await InventoryController.reviewStockRequest(id, {
        approved,
        accountingNote: note || undefined,
        rejectReason: approved ? undefined : reject,
      });
      setDrafts((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi duyệt phiếu');
    } finally {
      setReviewing(null);
    }
  };

  const filters = [
    'ALL',
    StockRequestStatus.PENDING,
    StockRequestStatus.COMPLETED,
    StockRequestStatus.REJECTED,
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === s ? `${filterActive} shadow-md` : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : STOCK_REQUEST_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {requests.map((r) => (
          <article
            key={r.id}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-bold text-stone-900">{r.requestNumber}</p>
                  <p className="mt-0.5 text-sm text-stone-600">
                    {STOCK_REQUEST_TYPE_LABELS[r.type]}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLES[r.status]}`}
                >
                  {STOCK_REQUEST_STATUS_LABELS[r.status]}
                </span>
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-sm">
                <span className="rounded-lg bg-white px-2 py-1 font-bold shadow-sm">
                  {r.fromWarehouseCode}
                </span>
                <span className="text-stone-400">→</span>
                <span className="rounded-lg bg-white px-2 py-1 font-bold shadow-sm">
                  {r.toWarehouseCode}
                </span>
              </div>

              {r.parentRequestNumber && (
                <p className="text-sm text-blue-700">
                  <span className="text-stone-400">Phiếu cấp gốc:</span>{' '}
                  <strong className="font-mono">{r.parentRequestNumber}</strong>
                </p>
              )}
              <p className="text-sm text-stone-600">
                <span className="text-stone-400">Chứng từ xin phép:</span>{' '}
                <strong>{r.permitDocumentNumber}</strong>
                <span className="text-stone-400"> · </span>
                {new Date(r.permitDocumentDate).toLocaleDateString('vi-VN')}
              </p>
              {r.purpose && (
                <p className="text-sm text-stone-500">
                  <span className="text-stone-400">Mục đích:</span> {r.purpose}
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {r.lines.map((l, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-stone-800">{l.ingredientName}</p>
                    <p className="text-xs text-stone-500">
                      {l.quantity.toLocaleString('vi-VN')} {l.unit}
                    </p>
                  </div>
                ))}
              </div>

              {r.status === StockRequestStatus.PENDING && theme === 'accounting' && (
                <div className="border-t border-stone-100 pt-4">
                  <input
                    value={getDraft(r.id).note}
                    onChange={(e) => setDraft(r.id, { note: e.target.value })}
                    placeholder="Ghi chú duyệt"
                    className="mb-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={getDraft(r.id).reject}
                    onChange={(e) => setDraft(r.id, { reject: e.target.value })}
                    placeholder="Lý do từ chối (nếu từ chối)"
                    className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={reviewing === r.id}
                      onClick={() => review(r.id, true)}
                      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${accentBtn}`}
                    >
                      ✓ Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={reviewing === r.id}
                      onClick={() => review(r.id, false)}
                      className="rounded-xl border-2 border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              )}

              {r.status === StockRequestStatus.PENDING && theme === 'warehouse' && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Đang chờ kế toán duyệt
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      {!requests.length && (
        <div className="mt-6">
          <EmptyState
            icon="📋"
            title="Không có phiếu trong bộ lọc này"
            description={
              filter === StockRequestStatus.PENDING
                ? 'Kho chưa lập phiếu mới hoặc đã duyệt hết'
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
