'use client';

import { ReactNode } from 'react';
import { ShiftManagementView } from '@/views/shift/ShiftManagementView';
import { AccountingLayout } from './AccountingLayout';

export function AccountingShiftManagementView() {
  return (
    <ShiftManagementView
      title="Quản lý ca & vận hành"
      description="Theo dõi ca làm việc và đơn hàng — Kế toán & Kho"
      ordersHref="/dashboard/manager/orders"
      reportsHref="/dashboard/accounting/reports"
      layout={(children: ReactNode) => <AccountingLayout>{children}</AccountingLayout>}
    />
  );
}
