'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserController } from '@/controllers/auth.controller';
import { getStoredUser } from '@/lib/auth-storage';
import { DashboardLayout } from '@/views/components/DashboardLayout';
import {
  REGISTERABLE_ROLES,
  ROLE_LABELS,
  Role,
  User,
} from '@/models/user.model';

export function RegisterEmployeeView() {
  const router = useRouter();
  const [admin, setAdmin] = useState<User | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: Role.STAFF,
    phone: '',
    address: '',
  });

  useEffect(() => {
    const user = getStoredUser<User>();
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/login');
      return;
    }
    setAdmin(user);
    loadEmployees();
  }, [router]);

  const loadEmployees = async () => {
    try {
      const data = await UserController.getEmployees();
      setEmployees(data);
    } catch {
      setError('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await UserController.createEmployee({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      setSuccess('Đăng ký nhân viên thành công!');
      setForm({
        fullName: '',
        email: '',
        password: '',
        role: Role.STAFF,
        phone: '',
        address: '',
      });
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-500">
        Đang tải...
      </div>
    );
  }

  return (
    <DashboardLayout
      user={admin}
      title="Đăng ký nhân viên"
      description="Chỉ Admin mới có quyền tạo tài khoản cho nhân viên"
      actions={
        <Link
          href="/dashboard/admin"
          className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
        >
          ← Về Dashboard
        </Link>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-stone-800">Thông tin nhân viên mới</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Họ và tên *</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Mật khẩu *</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Vai trò *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              >
                {REGISTERABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Số điện thoại</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Địa chỉ</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-[#2F80ED] py-2.5 font-semibold text-white hover:bg-[#2569c7] disabled:opacity-60"
          >
            {submitting ? 'Đang đăng ký...' : 'Đăng ký nhân viên'}
          </button>
        </form>

        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-stone-800">Danh sách nhân viên</h3>

          {loading ? (
            <p className="text-stone-500">Đang tải...</p>
          ) : employees.length === 0 ? (
            <p className="text-stone-500">Chưa có nhân viên nào.</p>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div
                  key={emp.id ?? (emp as User & { _id?: string })._id}
                  className="rounded-lg border border-stone-100 bg-stone-50 px-4 py-3"
                >
                  <p className="font-medium text-stone-800">{emp.fullName}</p>
                  <p className="text-sm text-stone-500">{emp.email}</p>
                  <p className="text-xs text-amber-700">
                    {ROLE_LABELS[emp.role as Role]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
