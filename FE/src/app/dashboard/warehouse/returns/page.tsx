'use client';

import { WarehouseLayout } from '@/views/warehouse/WarehouseLayout';
import { StockRequestForm } from '@/views/shared/StockRequestForm';
import { StockRequestsRegistry } from '@/views/shared/StockRequestsRegistry';
import { InventoryPageHeader } from '@/views/inventory/inventory-ui';
import { StockRequestType } from '@/models/stock-request.model';

/** Hoàn trả cuối ca — thủ kho / chủ quán (Store ADMIN) */
export default function WarehouseReturnsPage() {
  return (
    <WarehouseLayout>
      <div className="space-y-8">
        <InventoryPageHeader
          theme="warehouse"
          badge="Cuối ca"
          title="Hoàn trả & danh sách phiếu"
          subtitle="Gắn đúng mã PXK cấp phát. Theo dõi trạng thái hoàn trả về kho tổng."
        />
        <StockRequestForm type={StockRequestType.RETURN_TO_CENTRAL} />
        <section>
          <h2 className="mb-4 text-lg font-bold text-stone-900">Danh sách phiếu</h2>
          <StockRequestsRegistry />
        </section>
      </div>
    </WarehouseLayout>
  );
}
