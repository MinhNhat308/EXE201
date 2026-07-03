'use client';

import { ReactNode } from 'react';
import { StoreReportsHubView } from '@/views/store/reports/StoreReportsHubView';
import { ManagerLayout } from '@/views/manager/ManagerLayout';

export function ManagerStoreReportsView() {
  return (
    <StoreReportsHubView
      title="Trung tâm báo cáo ca"
      description="Doanh thu, đơn hàng, nhân viên, chốt ca — xem bảng & xuất Excel"
      layout={(children: ReactNode) => <ManagerLayout>{children}</ManagerLayout>}
    />
  );
}
