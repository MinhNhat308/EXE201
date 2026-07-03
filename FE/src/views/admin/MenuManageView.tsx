'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AdminMenuController,
  AdminToppingController,
  ToppingConfig,
} from '@/controllers/admin.controller';
import { formatCurrency } from '@/lib/format';
import { MenuItem } from '@/models/menu.model';
import { AdminLayout } from './AdminLayout';
import { AdminCrudTable } from './AdminCrudTable';
import { Modal } from '@/views/components/Modal';

const CATEGORIES = ['Trà sữa', 'Trà trái cây', 'Kem cheese', 'Cacao', 'Cà phê'];

export function MenuManageView() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<ToppingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0],
    price: 0,
    description: '',
    isAvailable: true,
    toppingIds: [] as string[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menu, tops] = await Promise.all([
        AdminMenuController.getAll(),
        AdminToppingController.getAll(),
      ]);
      setItems(menu);
      setToppings(tops);
    } catch {
      setError('Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      category: CATEGORIES[0],
      price: 35000,
      description: '',
      isAvailable: true,
      toppingIds: toppings.filter((t) => t.isActive).map((t) => t.id),
    });
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description ?? '',
      isAvailable: item.isAvailable,
      toppingIds: item.toppingIds ?? [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await AdminMenuController.update(editing.id, form);
      } else {
        await AdminMenuController.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa món này?')) return;
    try {
      await AdminMenuController.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const toggleTopping = (id: string) => {
    setForm((f) => ({
      ...f,
      toppingIds: f.toppingIds.includes(id)
        ? f.toppingIds.filter((x) => x !== id)
        : [...f.toppingIds, id],
    }));
  };

  return (
    <AdminLayout>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <AdminCrudTable
        title="Cấu hình menu"
        description="Danh sách món sau khi cấu hình — nhân viên thu ngân sẽ thấy menu này"
        loading={loading}
        data={items}
        onAdd={openCreate}
        addLabel="Thêm món"
        columns={[
          {
            key: 'name',
            header: 'Tên món',
            render: (r) => (
              <div>
                <p className="font-medium text-stone-800">{r.name}</p>
                <p className="text-xs text-stone-400">{r.category}</p>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Giá',
            render: (r) => formatCurrency(r.price),
          },
          {
            key: 'toppings',
            header: 'Topping',
            render: (r) =>
              r.toppings?.length ? (
                <span className="text-xs text-violet-600">{r.toppings.length} loại</span>
              ) : (
                <span className="text-xs text-stone-400">Không</span>
              ),
          },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (r) => (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {r.isAvailable ? 'Đang bán' : 'Ẩn'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (r) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="text-sm font-medium text-amber-600 hover:underline"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  className="text-sm font-medium text-red-500 hover:underline"
                >
                  Xóa
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 className="text-lg font-bold">
            {editing ? 'Sửa món' : 'Thêm món mới'}
          </h2>
          <div className="mt-4 space-y-3">
            <input
              required
              placeholder="Tên món"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min={0}
              placeholder="Giá"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              rows={2}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              />
              Đang bán
            </label>
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500">Topping áp dụng</p>
              <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                {toppings.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopping(t.id)}
                    className={`rounded-lg px-2 py-1 text-xs ${
                      form.toppingIds.includes(t.id)
                        ? 'bg-violet-500 text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border py-2.5 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#2F80ED] py-2.5 text-sm font-bold text-white"
            >
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
