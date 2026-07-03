'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { formatCurrency } from '@/lib/format';
import {
  filterReceiptsByLocalDate,
  sumReceiptMoney,
} from '@/lib/supplier-receipt-money';
import { SupplierReceipt } from '@/models/inventory.model';
import { InventoryPageHeader, StatCard } from '@/views/inventory/inventory-ui';
import { SupplierReceiptList } from '@/views/shared/SupplierReceiptList';
import { WarehouseLayout } from './WarehouseLayout';

export function SupplierReceiptView() {
  const [receipts, setReceipts] = useState<SupplierReceipt[]>([]);

  const load = useCallback(async () => {
    try {
      setReceipts(await InventoryController.getSupplierReceipts());
    } catch {
      /* read-only */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayReceipts = filterReceiptsByLocalDate(receipts, today);
    const monthPrefix = today.slice(0, 7);
    const monthReceipts = receipts.filter(
      (r) => new Date(r.documentDate).toISOString().slice(0, 7) === monthPrefix,
    );
    return {
      todayCount: todayReceipts.length,
      todayValue: sumReceiptMoney(todayReceipts),
      monthCount: monthReceipts.length,
      monthValue: sumReceiptMoney(monthReceipts),
    };
  }, [receipts]);

  return (
    <WarehouseLayout>
      <div className="space-y-6">
        <InventoryPageHeader
          theme="warehouse"
          badge="Thông tin"
          title="Nhập NCC — Kế toán thực hiện"
          subtitle="Phiếu NCC chỉ ghi vào KHO_TONG. Sau khi hàng về, bạn lập phiếu xin chuyển sang kho con."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="NCC hôm nay" value={stats.todayCount} icon="📥" />
          <StatCard
            label="Giá trị hôm nay"
            value={formatCurrency(stats.todayValue)}
            icon="💰"
            tone="info"
          />
          <StatCard label="NCC tháng này" value={stats.monthCount} icon="🗓️" />
          <StatCard
            label="Giá trị tháng"
            value={formatCurrency(stats.monthValue)}
            icon="📊"
            tone="info"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
            <span className="text-3xl">📥</span>
            <h2 className="mt-3 font-bold text-stone-900">Bước 1 — Kế toán</h2>
            <p className="mt-2 text-sm text-stone-600">
              Nhập hóa đơn NCC vào <strong>KHO_TONG</strong>
            </p>
            <Link
              href="/dashboard/accounting/supplier"
              className="mt-3 inline-block text-sm font-semibold text-violet-700 hover:underline"
            >
              (Kế toán) Mở form nhập NCC →
            </Link>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <span className="text-3xl">📋</span>
            <h2 className="mt-3 font-bold text-stone-900">Bước 2 — Kho (bạn)</h2>
            <p className="mt-2 text-sm text-stone-600">
              Lập phiếu xin xuất kèm chứng từ → chờ kế toán duyệt
            </p>
            <Link
              href="/dashboard/warehouse/requests"
              className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Lập phiếu ngay →
            </Link>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold text-stone-900">Phiếu NCC gần đây (chỉ xem)</h2>
          <SupplierReceiptList receipts={receipts} />
        </section>
      </div>
    </WarehouseLayout>
  );
}
