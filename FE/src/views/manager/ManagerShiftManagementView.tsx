'use client';

import { ReactNode } from 'react';
import { ShiftManagementView } from '@/views/shift/ShiftManagementView';
import { ManagerLayout } from './ManagerLayout';

export function ManagerShiftManagementView() {
  return (
    <ShiftManagementView
      title="Quản lý ca nhân viên"
      description="Theo dõi ca làm việc và đơn hàng hôm nay — Quản lý cửa hàng"
      ordersHref="/dashboard/manager/orders"
      reportsHref="/dashboard/manager/reports"
      layout={(children: ReactNode) => <ManagerLayout>{children}</ManagerLayout>}
    />
  );
}
