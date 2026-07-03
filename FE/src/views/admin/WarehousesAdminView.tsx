'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { WarehouseLocation } from '@/models/inventory.model';
import { AdminLayout } from './AdminLayout';
import { Modal } from '@/views/components/Modal';

export function WarehousesAdminView() {
  const { branchId, version } = useActiveBranch();
  const [items, setItems] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WarehouseLocation | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true,
    isKitchenSource: false,
    isCentralWarehouse: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await InventoryController.getWarehouses(true, branchId, true);
      setItems(data);
    } catch {
      setError('Không tải được danh sách kho');
    } finally {
      setLoading(false);
    }
  }, [branchId, version]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (w: WarehouseLocation) => {
    setEditing(w);
    setForm({
      name: w.name,
      description: w.description ?? '',
      sortOrder: w.sortOrder,
      isActive: w.isActive,
      isKitchenSource: w.isKitchenSource,
      isCentralWarehouse: w.isCentralWarehouse ?? false,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      await InventoryController.updateWarehouse(editing.id, form);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold">Cấu hình kho</h1>
      <p className="mt-1 text-sm text-stone-500">
        KHO_TONG: nhập NCC · KHO1: bếp trừ đơn · KHO2/KHO3: kho con
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-6 text-stone-500">Đang tải...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">TT</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3 font-mono font-medium">{w.code}</td>
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3 text-xs">
                    {w.isCentralWarehouse && (
                      <span className="mr-1 rounded bg-violet-100 px-2 py-0.5 text-violet-800">
                        Kho tổng
                      </span>
                    )}
                    {w.isKitchenSource && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-orange-800">
                        Kho bếp
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {w.isActive ? (
                      <span className="text-emerald-700">Hoạt động</span>
                    ) : (
                      <span className="text-stone-400">Tắt</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(w)}
                      className="text-amber-700 hover:underline"
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} className="max-w-lg">
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Sửa {editing.code}</h2>
            <label className="block text-sm">
              <span className="font-medium">Tên hiển thị</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Mô tả</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                rows={2}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Thứ tự hiển thị</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Đang hoạt động
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isCentralWarehouse}
                onChange={(e) =>
                  setForm({ ...form, isCentralWarehouse: e.target.checked })
                }
              />
              Là kho tổng (nhập NCC)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isKitchenSource}
                onChange={(e) =>
                  setForm({ ...form, isKitchenSource: e.target.checked })
                }
              />
              Kho bếp trừ khi hoàn thành đơn
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#2F80ED] py-2.5 font-medium text-white"
            >
              Lưu cấu hình
            </button>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}
