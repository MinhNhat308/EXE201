'use client';

import { ReactNode } from 'react';
import { StoreReportsHubView } from '@/views/store/reports/StoreReportsHubView';
import { AccountingLayout } from '@/views/accounting/AccountingLayout';

export function AccountingStoreReportsView() {
  return (
    <StoreReportsHubView
      title="Trung tâm báo cáo kế toán"
      description="Doanh thu, thanh toán, kho, chốt ca — bảng chi tiết & Excel"
      layout={(children: ReactNode) => <AccountingLayout>{children}</AccountingLayout>}
    />
  );
}
