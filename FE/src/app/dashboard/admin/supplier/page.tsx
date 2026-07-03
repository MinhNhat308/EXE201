'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { formatCurrency } from '@/lib/format';
import {
  filterReceiptsByLocalDate,
  sumReceiptMoney,
} from '@/lib/supplier-receipt-money';
import { SupplierReceipt } from '@/models/inventory.model';
import { AdminLayout } from '@/views/admin/AdminLayout';
import { StatCard } from '@/views/inventory/inventory-ui';
import { SupplierReceiptForm } from '@/views/shared/SupplierReceiptForm';
import { SupplierReceiptList } from '@/views/shared/SupplierReceiptList';

export default function AdminSupplierPage() {
  const [receipts, setReceipts] = useState<SupplierReceipt[]>([]);

  const load = useCallback(async () => {
    setReceipts(await InventoryController.getSupplierReceipts());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayReceipts = filterReceiptsByLocalDate(receipts, today);
    const monthPrefix = today.slice(0, 7);
    const monthReceipts = receipts.filter(
      (r) => new Date(r.documentDate).toISOString().slice(0, 7) === monthPrefix,
    );
    return {
      count: receipts.length,
      totalValue: sumReceiptMoney(receipts),
      todayCount: todayReceipts.length,
      todayValue: sumReceiptMoney(todayReceipts),
      monthCount: monthReceipts.length,
      monthValue: sumReceiptMoney(monthReceipts),
    };
  }, [receipts]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold">Nhập NCC → Kho tổng</h1>
      <p className="mt-1 text-sm text-stone-500">
        Admin có thể ghi nhận NCC khi kế toán vắng mặt
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Phiếu đã lập" value={stats.count} icon="📥" tone="info" />
        <StatCard
          label="Tổng giá trị"
          value={formatCurrency(stats.totalValue)}
          icon="💰"
          tone="info"
        />
        <StatCard label="Hôm nay" value={stats.todayCount} icon="📅" />
        <StatCard
          label="Giá trị hôm nay"
          value={formatCurrency(stats.todayValue)}
          icon="💵"
        />
        <StatCard label="Tháng này" value={stats.monthCount} icon="🗓️" />
        <StatCard
          label="Giá trị tháng"
          value={formatCurrency(stats.monthValue)}
          icon="📊"
        />
      </div>

      <div className="mt-6">
        <SupplierReceiptForm onSuccess={load} />
      </div>
      <div className="mt-10">
        <h2 className="text-lg font-semibold">Phiếu gần đây</h2>
        <div className="mt-4">
          <SupplierReceiptList receipts={receipts} />
        </div>
      </div>
    </AdminLayout>
  );
}
