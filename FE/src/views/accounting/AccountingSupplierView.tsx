'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { formatCurrency } from '@/lib/format';
import {
  filterReceiptsByLocalDate,
  sumReceiptMoney,
} from '@/lib/supplier-receipt-money';
import { SupplierReceipt } from '@/models/inventory.model';
import { SupplierReceiptForm } from '@/views/shared/SupplierReceiptForm';
import { SupplierReceiptList } from '@/views/shared/SupplierReceiptList';
import { InventoryPageHeader, StatCard } from '@/views/inventory/inventory-ui';
import { AccountingLayout } from './AccountingLayout';

export function AccountingSupplierView() {
  const { branchId, version } = useActiveBranch();
  const [receipts, setReceipts] = useState<SupplierReceipt[]>([]);

  const load = useCallback(async () => {
    const data = await InventoryController.getSupplierReceipts(branchId, true);
    setReceipts(data);
  }, [branchId, version]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalValue = sumReceiptMoney(receipts);
    const today = new Date().toISOString().slice(0, 10);
    const todayReceipts = filterReceiptsByLocalDate(receipts, today);
    const monthPrefix = today.slice(0, 7);
    const monthReceipts = receipts.filter(
      (r) => new Date(r.documentDate).toISOString().slice(0, 7) === monthPrefix,
    );
    return {
      count: receipts.length,
      totalValue,
      todayCount: todayReceipts.length,
      todayValue: sumReceiptMoney(todayReceipts),
      monthCount: monthReceipts.length,
      monthValue: sumReceiptMoney(monthReceipts),
    };
  }, [receipts]);

  return (
    <AccountingLayout>
      <div className="space-y-8">
        <InventoryPageHeader
          theme="accounting"
          badge="Nhập NCC"
          title="Nhập nhà cung cấp → Kho tổng"
          subtitle="Chỉ ghi nhận vào KHO_TONG. Quản lý kho lập phiếu xin chuyển sang KHO1/2/3 sau khi kế toán duyệt."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

        <SupplierReceiptForm onSuccess={load} />

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-stone-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              📥
            </span>
            Phiếu nhập gần đây
          </h2>
          <SupplierReceiptList receipts={receipts} />
        </section>
      </div>
    </AccountingLayout>
  );
}
