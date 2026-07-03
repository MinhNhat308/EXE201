'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
export type SupplierReceiptListLine = {
  ingredientId?: string;
  ingredientName?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  expiryDate?: string;
};

export type SupplierReceiptListItem = {
  id?: string;
  supplierName: string;
  documentNumber: string;
  documentDate: string;
  warehouseCode?: string;
  warehouseName?: string;
  lineCount?: number;
  totalValue?: number;
  lines?: SupplierReceiptListLine[];
  note?: string;
  createdByName?: string;
  createdAt?: string;
};

function receiptTotal(r: SupplierReceiptListItem) {
  return (
    r.totalValue ??
    (r.lines ?? []).reduce(
      (s, l) => s + (l.lineTotal ?? l.quantity * (l.unitPrice ?? 0)),
      0,
    )
  );
}

export function SupplierReceiptList({
  receipts,
  emptyTitle = 'Chưa có phiếu nhập NCC',
  emptyHint = 'Lập phiếu đầu tiên ở form phía trên',
}: {
  receipts: SupplierReceiptListItem[];
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!receipts.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center">
        <span className="text-3xl">📭</span>
        <p className="mt-2 text-sm text-stone-500">{emptyTitle}</p>
        {emptyHint && <p className="mt-1 text-xs text-stone-400">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {receipts.map((r) => {
        const rowId = r.id ?? r.documentNumber;
        const open = expandedId === rowId;
        const total = receiptTotal(r);
        const whLabel = r.warehouseName ?? r.warehouseCode ?? 'KHO_TONG';

        return (
          <article
            key={rowId}
            className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setExpandedId(open ? null : rowId)}
              className="flex w-full items-start gap-3 p-4 text-left hover:bg-blue-50/40"
            >
              <span className="text-2xl">🏭</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-stone-900">{r.supplierName}</p>
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {whLabel}
                  </span>
                </div>
                <p className="font-mono text-sm text-blue-800">CT {r.documentNumber}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(r.documentDate).toLocaleDateString('vi-VN')} ·{' '}
                  {r.lineCount ?? r.lines?.length ?? 0} dòng
                  {total > 0 && (
                    <>
                      {' '}
                      · <strong>{formatCurrency(total)}</strong>
                    </>
                  )}
                  {' · '}
                  {r.createdByName ?? '—'}
                </p>
              </div>
              <span className="text-stone-400">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
              <div className="border-t border-blue-100 bg-stone-50/50 px-4 py-3">
                {r.createdAt && (
                  <p className="mb-1 text-xs text-stone-500">
                    <strong>Lập lúc:</strong>{' '}
                    {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </p>
                )}
                {r.note && (
                  <p className="mb-2 text-xs text-stone-600">
                    <strong>Ghi chú:</strong> {r.note}
                  </p>
                )}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-stone-500">
                      <th className="py-1">Nguyên liệu</th>
                      <th className="py-1 text-right">SL</th>
                      <th className="py-1 text-right">Đơn giá</th>
                      <th className="py-1">HSD</th>
                      <th className="py-1 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.lines ?? []).map((line, i) => (
                      <tr key={i} className="border-t border-stone-200/80">
                        <td className="py-1.5">
                          {line.ingredientName ?? line.ingredientId}
                          {line.unit && (
                            <span className="text-stone-400"> ({line.unit})</span>
                          )}
                        </td>
                        <td className="py-1.5 text-right">{line.quantity}</td>
                        <td className="py-1.5 text-right">
                          {(line.unitPrice ?? 0) > 0
                            ? (line.unitPrice ?? 0).toLocaleString('vi-VN')
                            : '—'}
                        </td>
                        <td className="py-1.5 text-xs text-stone-600">
                          {line.expiryDate
                            ? new Date(line.expiryDate).toLocaleDateString('vi-VN')
                            : '—'}
                        </td>
                        <td className="py-1.5 text-right font-medium">
                          {(line.lineTotal ?? 0) > 0
                            ? formatCurrency(line.lineTotal ?? 0)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {total > 0 && (
                    <tfoot>
                      <tr className="border-t border-stone-300 font-semibold">
                        <td colSpan={4} className="py-2 text-right text-stone-600">
                          Tổng cộng
                        </td>
                        <td className="py-2 text-right text-blue-800">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
