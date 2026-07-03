'use client';

import { AdminLayout } from './AdminLayout';
import { WarehouseStockPanel } from '@/views/shared/WarehouseStockPanel';

export function AdminWarehouseStockView() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold">Tồn kho theo kho</h1>
      <p className="mt-1 text-sm text-stone-500">
        Xem tồn realtime — chỉnh mức tối thiểu tại trang Cấu hình tồn tối thiểu
      </p>
      <div className="mt-6">
        <WarehouseStockPanel />
      </div>
    </AdminLayout>
  );
}
