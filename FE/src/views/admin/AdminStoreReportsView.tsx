'use client';

import { ReactNode } from 'react';
import { StoreReportsHubView } from '@/views/store/reports/StoreReportsHubView';
import { AdminLayout } from '@/views/admin/AdminLayout';

export function AdminStoreReportsView() {
  return (
    <StoreReportsHubView
      title="Trung tâm báo cáo cửa hàng"
      description="17 loại báo cáo vận hành — xem chi tiết, in và xuất Excel"
      layout={(children: ReactNode) => <AdminLayout>{children}</AdminLayout>}
    />
  );
}
