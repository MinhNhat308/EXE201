'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { Ingredient } from '@/models/inventory.model';
import {
  INGREDIENT_CATEGORY_LABELS,
  IngredientCategory,
} from '@/models/ingredient-category.model';
import { AdminLayout } from './AdminLayout';
import { Modal } from '@/views/components/Modal';

export function IngredientsAdminView() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: IngredientCategory.LIQUID,
    currentStock: 0,
    minStock: 0,
    shelfLifeDays: '' as number | '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      category: IngredientCategory.LIQUID,
      currentStock: 0,
      minStock: 0,
      shelfLifeDays: '',
    });
    setModalOpen(true);
  };

  const openEdit = (row: Ingredient) => {
    setEditing(row);
    setForm({
      name: row.name,
      category: row.category,
      currentStock: row.currentStock,
      minStock: row.minStock,
      shelfLifeDays: row.shelfLifeDays ?? '',
    });
    setModalOpen(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await InventoryController.getIngredients();
      setItems(data);
    } catch {
      setError('Không tải được nguyên liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await InventoryController.updateIngredient(editing.id, {
          name: form.name.trim(),
          category: form.category,
          shelfLifeDays:
            form.shelfLifeDays === '' ? undefined : Number(form.shelfLifeDays),
        });
      } else {
        await InventoryController.createIngredient({
          name: form.name.trim(),
          category: form.category,
          currentStock: form.currentStock,
          minStock: form.minStock,
          shelfLifeDays:
            form.shelfLifeDays === '' ? undefined : Number(form.shelfLifeDays),
        });
      }
      setModalOpen(false);
      setForm({
        name: '',
        category: IngredientCategory.LIQUID,
        currentStock: 0,
        minStock: 0,
        shelfLifeDays: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Nguyên liệu</h1>
          <p className="mt-1 text-sm text-stone-500">
            Chất lỏng (sữa, nước, trà pha sẵn) luôn dùng <strong>ml</strong>. Khô/topping
            dùng <strong>g</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#2F80ED] px-4 py-2 hover:bg-[#2569c7] text-sm font-medium text-white hover:bg-[#2569c7]"
        >
          + Thêm nguyên liệu
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-stone-500">Đang tải...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Đơn vị</th>
                <th className="px-4 py-3 font-medium">Tồn (tổng)</th>
                <th className="px-4 py-3 font-medium">HSD mặc định</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t border-stone-50">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">
                    {INGREDIENT_CATEGORY_LABELS[row.category] ?? row.category}
                  </td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3">
                    {row.currentStock.toLocaleString('vi-VN')} {row.unit}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {row.shelfLifeDays ? `${row.shelfLifeDays} ngày` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold">
            {editing ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}
          </h2>
          <label className="block text-sm">
            <span className="font-medium">Tên</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="VD: Sữa tươi, Nước trà xanh..."
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Loại</span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as IngredientCategory })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {Object.values(IngredientCategory).map((c) => (
                <option key={c} value={c}>
                  {INGREDIENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Hạn dùng mặc định (ngày)</span>
            <input
              type="number"
              min={1}
              placeholder="VD: 7 — gợi ý HSD khi nhập NCC"
              value={form.shelfLifeDays}
              onChange={(e) =>
                setForm({
                  ...form,
                  shelfLifeDays: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium">Tồn ban đầu (KHO1)</span>
                <input
                  type="number"
                  min={0}
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm({ ...form, currentStock: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Tồn tối thiểu</span>
                <input
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
            </div>
          )}
          <p className="text-xs text-stone-500">
            {form.category === IngredientCategory.LIQUID
              ? 'Đơn vị tự động: ml (VD tồn 80.000 = 80L)'
              : 'Đơn vị tự động: g'}
          </p>
          <button
            type="submit"
            className="w-full rounded-lg bg-[#2F80ED] py-2.5 font-medium text-white hover:bg-[#2569c7]"
          >
            Lưu
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
