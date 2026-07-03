'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReportsController } from '@/controllers/reports.controller';
import { formatCurrency } from '@/lib/format';
import { localDateString } from '@/lib/local-date';
import type { ChainReportBundle } from '@/models/branch.model';
import { WORK_SHIFT_LABELS, WorkShift } from '@/models/staff.model';
import { AdminLayout } from './AdminLayout';

export function ChainReportsAdminView() {
  const today = localDateString();
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState<WorkShift | 'ALL'>('ALL');
  const [data, setData] = useState<ChainReportBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await ReportsController.getChainBundle(
        date,
        shift === 'ALL' ? undefined : shift,
      );
      setData(bundle);
      setError('');
    } catch {
      setError('Không tải được báo cáo chuỗi');
    } finally {
      setLoading(false);
    }
  }, [date, shift]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-stone-900">Tổng hợp chuỗi</h1>
        <p className="mt-1 text-sm text-stone-500">
          So sánh doanh thu từng chi nhánh — chọn ngày / ca để lọc
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as WorkShift | 'ALL')}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả ca</option>
            {Object.values(WorkShift).map((s) => (
              <option key={s} value={s}>
                {WORK_SHIFT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="mt-8 text-stone-500">Đang tải…</p>
        ) : data ? (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-stone-500">Tổng đơn</p>
                <p className="mt-1 text-3xl font-bold">{data.totals.orderCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                <p className="text-xs font-medium uppercase text-emerald-700">Doanh thu chuỗi</p>
                <p className="mt-1 text-3xl font-bold text-emerald-900">
                  {formatCurrency(data.totals.revenue)}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-stone-500">Chi nhánh</p>
                <p className="mt-1 text-3xl font-bold">{data.meta.branchCount ?? data.branches.length}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Chi nhánh</th>
                    <th className="px-4 py-3 font-medium text-right">Đơn</th>
                    <th className="px-4 py-3 font-medium text-right">Hoàn thành</th>
                    <th className="px-4 py-3 font-medium text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.branches.map((b) => (
                    <tr key={b.branchId} className="border-t border-stone-100">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold">{b.code}</span>
                        <span className="ml-2 text-stone-600">{b.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{b.orderCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{b.completedCount}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(b.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
