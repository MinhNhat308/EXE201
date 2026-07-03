'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AdminToppingController,
  ToppingConfig,
} from '@/controllers/admin.controller';
import { formatCurrency } from '@/lib/format';
import { AdminLayout } from './AdminLayout';
import { AdminCrudTable } from './AdminCrudTable';
import { Modal } from '@/views/components/Modal';

export function ToppingsManageView() {
  const [items, setItems] = useState<ToppingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ToppingConfig | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    price: 5000,
    isActive: true,
    sortOrder: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await AdminToppingController.getAll());
    } catch {
      setError('Không tải được topping');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', price: 5000, isActive: true, sortOrder: items.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (item: ToppingConfig) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: item.price,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await AdminToppingController.update(editing.id, form);
      } else {
        await AdminToppingController.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa topping này?')) return;
    try {
      await AdminToppingController.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  return (
    <AdminLayout>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}
      <AdminCrudTable
        title="Cấu hình topping"
        description="Danh sách topping — gán vào từng món trong menu"
        loading={loading}
        data={items}
        onAdd={openCreate}
        addLabel="Thêm topping"
        columns={[
          { key: 'name', header: 'Tên', render: (r) => r.name },
          { key: 'price', header: 'Giá thêm', render: (r) => formatCurrency(r.price) },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (r) => (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200'
                }`}
              >
                {r.isActive ? 'Bật' : 'Tắt'}
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
                  className="text-sm text-amber-600 hover:underline"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Xóa
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-sm">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6">
          <h2 className="font-bold">{editing ? 'Sửa topping' : 'Thêm topping'}</h2>
          <div className="mt-4 space-y-3">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Tên topping"
            />
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Đang dùng
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border py-2">
              Hủy
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-[#2F80ED] py-2 font-bold text-white">
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
