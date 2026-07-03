'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { formatCurrency } from '@/lib/format';
import { OperationsDashboard } from '@/models/stock-request.model';
import { usePolling } from '@/lib/use-polling';
import { useActiveBranch } from '@/lib/use-active-branch';
import { StatCard } from '@/views/inventory/inventory-ui';

export function OperationsDashboardPanel({
  warehouseHref,
  accountingHref,
}: {
  warehouseHref: string;
  accountingHref: string;
}) {
  const { branchId, version } = useActiveBranch();
  const [data, setData] = useState<OperationsDashboard | null>(null);
  const [expiryPreview, setExpiryPreview] = useState<
    Awaited<ReturnType<typeof InventoryController.getExpiryAlerts>>
  >([]);

  const load = useCallback(async () => {
    try {
      const [ops, alerts] = await Promise.all([
        InventoryController.getOperationsDashboard(branchId, true),
        InventoryController.getExpiryAlerts(7, branchId, true),
      ]);
      setData(ops);
      setExpiryPreview(alerts.slice(0, 5));
    } catch {
      /* ignore */
    }
  }, [branchId, version]);

  useEffect(() => {
    void load();
  }, [load]);

  usePolling(load, 20_000);

  if (!data) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-600">
          Vận hành trong ngày · {data.businessDate}
        </h2>
        <div className="flex gap-2 text-sm">
          <Link href={warehouseHref} className="font-medium text-blue-600 hover:underline">
            Kho →
          </Link>
          <Link href={accountingHref} className="font-medium text-blue-600 hover:underline">
            Kế toán →
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Chờ kế toán duyệt"
          value={data.pendingApproval}
          icon="⏳"
          tone="warning"
        />
        <StatCard
          label="Cấp phát hôm nay"
          value={data.completedIssuesToday}
          icon="📤"
          tone="info"
          hint="Tồn ca — bàn giao ca sau"
        />
        <StatCard
          label="Thu hồi (tuỳ chọn)"
          value={data.pendingReturnsToday}
          icon="📥"
          hint="Chỉ khi muốn đưa về KHO_TONG"
        />
        <StatCard
          label="Sắp hết hạn (7 ngày)"
          value={data.expiringSoonCount ?? 0}
          icon="📅"
          tone={(data.expiringSoonCount ?? 0) > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="NCC hôm nay"
          value={data.todayReceiptCount ?? 0}
          icon="🏭"
          hint={
            (data.todayReceiptValue ?? 0) > 0
              ? formatCurrency(data.todayReceiptValue ?? 0)
              : 'Chưa có nhập'
          }
        />
        <StatCard
          label="NCC tháng này"
          value={formatCurrency(data.monthReceiptValue ?? 0)}
          icon="💰"
          hint={`${data.monthReceiptCount ?? 0} phiếu`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm">
          <p className="font-semibold text-blue-900">Luồng trong ngày (đơn giản)</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-blue-800/90">
            <li>Sáng: lập phiếu <strong>cấp phát</strong> (KHO_TONG → KHO1/2/3)</li>
            <li>Kế toán duyệt → ca dùng tồn tại kho con</li>
            <li>Cuối ca: <strong>bàn giao ca sau</strong> — phần còn lại giữ nguyên tại kho</li>
            <li>Thu hồi về kho tổng chỉ khi thực sự cần (tuỳ chọn)</li>
          </ol>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <p className="font-semibold text-stone-800">Hôm nay & hạn dùng</p>
          <p className="mt-2 text-stone-600">
            Cấp phát đã duyệt: <strong>{data.completedIssuesToday}</strong> phiếu
          </p>
          <p className="text-stone-600">
            Thu hồi về tổng: <strong>{data.completedReturnsToday}</strong> phiếu
          </p>
          <p className="mt-2 text-stone-600">
            NCC nhập kho: <strong>{data.todayReceiptCount ?? 0}</strong> phiếu ·{' '}
            <strong>{formatCurrency(data.todayReceiptValue ?? 0)}</strong>
          </p>
          {expiryPreview.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-stone-100 pt-2 text-xs text-amber-800">
              {expiryPreview.map((a, i) => (
                <li key={i}>
                  {a.ingredientName} · {a.warehouseCode} · còn {a.quantity}
                  {a.unit}
                  {a.expiryDate && (
                    <>
                      {' '}
                      — HSD{' '}
                      {new Date(a.expiryDate).toLocaleDateString('vi-VN')}
                      {a.daysLeft != null && (
                        <span>
                          {' '}
                          ({a.daysLeft <= 0 ? 'quá hạn' : `${a.daysLeft} ngày`})
                        </span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
