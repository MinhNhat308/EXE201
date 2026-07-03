'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AdminPaymentController,
  PaymentMethodConfig,
} from '@/controllers/admin.controller';
import { AdminLayout } from './AdminLayout';
import { AdminCrudTable } from './AdminCrudTable';
import { Modal } from '@/views/components/Modal';

export function PaymentsManageView() {
  const [items, setItems] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethodConfig | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '',
    label: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await AdminPaymentController.getAll());
    } catch {
      setError('Không tải được phương thức thanh toán');
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
      code: '',
      label: '',
      description: '',
      isActive: true,
      sortOrder: items.length + 1,
    });
    setModalOpen(true);
  };

  const openEdit = (item: PaymentMethodConfig) => {
    setEditing(item);
    setForm({
      code: item.code,
      label: item.label,
      description: item.description ?? '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await AdminPaymentController.update(editing.id, form);
      } else {
        await AdminPaymentController.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa phương thức này?')) return;
    try {
      await AdminPaymentController.remove(id);
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
        title="Phương thức thanh toán"
        description="Cấu hình các hình thức thanh toán tại quầy thu ngân"
        loading={loading}
        data={items}
        onAdd={openCreate}
        addLabel="Thêm PT"
        columns={[
          {
            key: 'code',
            header: 'Mã',
            render: (r) => (
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{r.code}</code>
            ),
          },
          { key: 'label', header: 'Tên hiển thị', render: (r) => r.label },
          {
            key: 'desc',
            header: 'Mô tả',
            render: (r) => (
              <span className="text-stone-500">{r.description ?? '—'}</span>
            ),
          },
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
          <h2 className="font-bold">
            {editing ? 'Sửa phương thức' : 'Thêm phương thức'}
          </h2>
          <div className="mt-4 space-y-3">
            <input
              required
              disabled={!!editing}
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-stone-100"
              placeholder="Mã (VD: CASH)"
            />
            <input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Tên hiển thị"
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Mô tả"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Đang dùng tại quầy
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
