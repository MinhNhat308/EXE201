'use client';

import { useEffect, useMemo, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { WarehouseLocation } from '@/models/inventory.model';
import { useActiveBranch } from '@/lib/use-active-branch';

/** Kho thuộc chi nhánh đang chọn (chuỗi) hoặc toàn tenant (store). */
export function useBranchWarehouses() {
  const { branchId, isChain, version } = useActiveBranch();
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    InventoryController.getWarehouses(false, isChain ? branchId : undefined, true)
      .then((rows) => {
        if (!cancelled) setWarehouses(rows);
      })
      .catch(() => {
        if (!cancelled) setWarehouses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, isChain, version]);

  const central = useMemo(
    () => warehouses.find((w) => w.isCentralWarehouse) ?? warehouses[0],
    [warehouses],
  );
  const kitchen = useMemo(
    () => warehouses.find((w) => w.isKitchenSource) ?? warehouses[1],
    [warehouses],
  );

  return {
    warehouses,
    centralId: central?.id,
    kitchenId: kitchen?.id,
    loading,
    branchId: isChain ? branchId : undefined,
    version,
  };
}
