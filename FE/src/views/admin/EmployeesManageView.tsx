'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminUserController } from '@/controllers/admin.controller';
import {
  getStoredPlan,
  getStoredSubscription,
  getStoredTenant,
} from '@/lib/auth-storage';
import {
  getRegisterableRoles,
  STORE_EMPLOYEE_ROLE_LABELS,
} from '@/lib/registerable-roles';
import { ROLE_LABELS, Role, User } from '@/models/user.model';
import { TenantInfo } from '@/models/tenant.model';
import { AdminLayout } from './AdminLayout';
import { AdminCrudTable } from './AdminCrudTable';
import { Modal } from '@/views/components/Modal';

export function EmployeesManageView() {
  const tenant = getStoredTenant<TenantInfo>();
  const sub = getStoredSubscription<{ plan?: string }>();
  const plan = getStoredPlan() ?? sub?.plan;

  const registerableRoles = useMemo(
    () => getRegisterableRoles(plan, tenant),
    [plan, tenant],
  );

  const roleLabel = (role: Role) =>
    STORE_EMPLOYEE_ROLE_LABELS[role] ?? ROLE_LABELS[role] ?? role;

  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState('');

  const defaultRole = registerableRoles[0] ?? Role.STAFF;

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    role: defaultRole,
    phone: '',
    address: '',
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await AdminUserController.getAll();
      setEmployees(all.filter((u) => u.role !== Role.ADMIN));
    } catch {
      setError('Không tải được nhân viên');
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
      fullName: '',
      email: '',
      username: '',
      password: '',
      role: defaultRole,
      phone: '',
      address: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      username: user.username ?? '',
      password: '',
      role: user.role as Role,
      phone: user.phone ?? '',
      address: user.address ?? '',
      isActive: user.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          fullName: form.fullName,
          email: form.email,
          username: form.username.trim() || undefined,
          role: form.role,
          phone: form.phone || undefined,
          address: form.address || undefined,
          isActive: form.isActive,
        };
        if (form.password) payload.password = form.password;
        await AdminUserController.update(editing.id, payload);
      } else {
        if (!form.password || form.password.length < 6) {
          setError('Mật khẩu tối thiểu 6 ký tự');
          return;
        }
        if (!form.username.trim()) {
          setError('Tên đăng nhập (username) bắt buộc cho nhân viên');
          return;
        }
        await AdminUserController.create({
          fullName: form.fullName,
          email: form.email,
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone || undefined,
          address: form.address || undefined,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa tài khoản nhân viên này?')) return;
    try {
      await AdminUserController.remove(id);
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

      {tenant?.slug && (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          Nhân viên đăng nhập bằng <strong>username</strong> + mã cửa hàng{' '}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-amber-800">
            {tenant.slug}
          </code>
        </div>
      )}

      <AdminCrudTable
        title="Quản lý nhân viên"
        description="Tạo tài khoản với username — NV dùng username + mã cửa hàng để đăng nhập"
        loading={loading}
        data={employees}
        onAdd={registerableRoles.length > 0 ? openCreate : undefined}
        addLabel="Thêm nhân viên"
        columns={[
          {
            key: 'name',
            header: 'Nhân viên',
            render: (r) => (
              <div>
                <p className="font-medium">{r.fullName}</p>
                <p className="text-xs text-stone-400">{r.email}</p>
              </div>
            ),
          },
          {
            key: 'username',
            header: 'Username',
            render: (r) => (
              <span className="font-mono text-sm text-stone-700">{r.username ?? '—'}</span>
            ),
          },
          {
            key: 'role',
            header: 'Vai trò',
            render: (r) => roleLabel(r.role as Role),
          },
          {
            key: 'phone',
            header: 'SĐT',
            render: (r) => r.phone ?? '—',
          },
          {
            key: 'status',
            header: 'Tài khoản',
            render: (r) => (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  r.isActive !== false
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {r.isActive !== false ? 'Hoạt động' : 'Khóa'}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-md">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6">
          <h2 className="font-bold">
            {editing ? 'Sửa nhân viên' : 'Tạo tài khoản nhân viên'}
          </h2>
          <div className="mt-4 space-y-3">
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Họ tên"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Email (liên hệ / khôi phục)"
            />
            <input
              required={!editing}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
              placeholder="Username đăng nhập (vd: cashier)"
            />
            <input
              type="password"
              minLength={editing ? 0 : 6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder={editing ? 'Mật khẩu mới (để trống nếu giữ)' : 'Mật khẩu'}
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              {registerableRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Số điện thoại"
            />
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Địa chỉ"
            />
            {editing && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Tài khoản hoạt động
              </label>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border py-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#2F80ED] py-2 font-bold text-white"
            >
              {editing ? 'Cập nhật' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
