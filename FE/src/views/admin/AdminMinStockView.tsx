'use client';

import { useCallback, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { StockItem } from '@/models/inventory.model';
import { WarehouseLocation } from '@/models/inventory.model';
import { AdminLayout } from './AdminLayout';

export function AdminMinStockView() {
  const { branchId, version } = useActiveBranch();
  const { warehouses, centralId } = useBranchWarehouses();
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState<StockItem[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setWarehouseId(centralId ?? warehouses[0]?.id ?? '');
  }, [centralId, warehouses, branchId, version]);

  const load = useCallback(async () => {
    if (!warehouseId) return;
    const data = await InventoryController.getStock(warehouseId);
    setItems(data);
  }, [warehouseId, version]);

  useEffect(() => {
    load();
  }, [load]);

  const saveMin = async (ingredientId: string, minStock: number) => {
    setSaving(ingredientId);
    try {
      await InventoryController.updateWarehouseStock(warehouseId, ingredientId, {
        minStock,
      });
      await load();
    } finally {
      setSaving(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold">Mức tồn tối thiểu</h1>
      <p className="mt-1 text-sm text-stone-500">Cảnh báo sắp hết theo từng kho</p>

      <select
        value={warehouseId}
        onChange={(e) => setWarehouseId(e.target.value)}
        className="mt-4 rounded-lg border px-3 py-2 text-sm"
      >
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.code} — {w.name}
          </option>
        ))}
      </select>

      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-2 text-left">Nguyên liệu</th>
              <th className="px-4 py-2 text-left">Tồn</th>
              <th className="px-4 py-2 text-left">Tối thiểu</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <MinStockRow
                key={row.id}
                row={row}
                saving={saving === row.id}
                onSave={(min) => saveMin(row.id, min)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

function MinStockRow({
  row,
  saving,
  onSave,
}: {
  row: StockItem;
  saving: boolean;
  onSave: (min: number) => void;
}) {
  const [min, setMin] = useState(row.minStock);

  return (
    <tr className="border-t">
      <td className="px-4 py-2">{row.name}</td>
      <td className="px-4 py-2">
        {row.displayStock} {row.displayUnit}
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-28 rounded border px-2 py-1"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(min)}
            className="text-xs text-amber-700 hover:underline disabled:opacity-50"
          >
            {saving ? '...' : 'Lưu'}
          </button>
        </div>
      </td>
    </tr>
  );
}
