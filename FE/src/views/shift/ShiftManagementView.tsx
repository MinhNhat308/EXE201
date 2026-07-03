'use client';

import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { OrderController } from '@/controllers/order.controller';
import { ShiftController, ShiftSessionRecord } from '@/controllers/shift.controller';
import { AdminUserController } from '@/controllers/admin.controller';
import { getStoredTenant } from '@/lib/auth-storage';
import { formatCurrency } from '@/lib/format';
import { WORK_ROLE_LABELS, WORK_SHIFT_LABELS, WorkShift } from '@/models/staff.model';
import { normalizeStatus, Order, OrderStatus } from '@/models/order.model';
import { ROLE_LABELS, Role, User } from '@/models/user.model';
import { TenantInfo } from '@/models/tenant.model';

const SHIFT_FILTERS: { key: WorkShift | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả ca' },
  ...Object.values(WorkShift).map((s) => ({
    key: s,
    label: WORK_SHIFT_LABELS[s],
  })),
];

type Props = {
  title: string;
  description: string;
  layout: (children: ReactNode) => ReactNode;
  ordersHref: string;
  reportsHref?: string;
  canCloseSessions?: boolean;
};

export function ShiftManagementView({
  title,
  description,
  layout,
  ordersHref,
  reportsHref,
  canCloseSessions = true,
}: Props) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ShiftSessionRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shiftFilter, setShiftFilter] = useState<WorkShift | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tenant = getStoredTenant<TenantInfo>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const shiftArg = shiftFilter === 'ALL' ? undefined : shiftFilter;
      const [users, todayOrders, todaySessions] = await Promise.all([
        AdminUserController.getOperational(),
        OrderController.getToday(shiftArg, false),
        ShiftController.listToday(shiftArg),
      ]);
      setEmployees(users);
      setOrders(
        todayOrders.filter((o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED),
      );
      setSessions(todaySessions);
      setError('');
    } catch {
      setError('Không tải được dữ liệu ca');
    } finally {
      setLoading(false);
    }
  }, [shiftFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const completed = orders.filter(
      (o) => normalizeStatus(o.status) === OrderStatus.COMPLETED,
    );
    const paid = orders.filter(
      (o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED,
    );
    return {
      total: paid.length,
      completed: completed.length,
      revenue: paid.reduce((s, o) => s + (o.total ?? 0), 0),
      servedRevenue: completed.reduce((s, o) => s + (o.total ?? 0), 0),
      activeSessions: sessions.filter((s) => !s.endedAt).length,
    };
  }, [orders, sessions]);

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Kết thúc ca làm việc của nhân viên này?')) return;
    try {
      await ShiftController.forceClose(sessionId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đóng được ca');
    }
  };

  const content = (
    <div className="mx-auto max-w-5xl">
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reportsHref && (
            <Link
              href={reportsHref}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Báo cáo doanh thu →
            </Link>
          )}
          <Link
            href={ordersHref}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Xem đơn theo ca →
          </Link>
        </div>
      </div>

      {tenant?.slug && (
        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">Mã cửa hàng cho nhân viên</p>
          <p className="mt-1 font-mono text-lg font-bold text-amber-800">{tenant.slug}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {SHIFT_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setShiftFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              shiftFilter === f.key
                ? 'bg-[#2F80ED] text-white'
                : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={`mt-6 grid gap-4 sm:grid-cols-4 ${loading ? 'animate-pulse' : ''}`}>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase text-stone-400">Đang làm ca</p>
          <p className="mt-1 text-2xl font-bold text-[#2F80ED]">{stats.activeSessions}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase text-stone-400">Đơn hôm nay</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase text-stone-400">Hoàn thành</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase text-stone-400">Doanh thu thu</p>
          <p className="mt-1 text-2xl font-bold text-[#2F80ED]">
            {formatCurrency(stats.revenue)}
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            Đã giao: {formatCurrency(stats.servedRevenue)}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Ca làm việc hôm nay
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Ca / vai trò</th>
                <th className="px-4 py-3">Bắt đầu</th>
                <th className="px-4 py-3">Trạng thái</th>
                {canCloseSessions && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                    Đang tải...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                    Chưa có ai check-in ca hôm nay
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-medium text-stone-800">{s.userName}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {WORK_SHIFT_LABELS[s.workShift]}
                      {s.workRole ? ` · ${WORK_ROLE_LABELS[s.workRole]}` : ''}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {new Date(s.startedAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          s.endedAt
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {s.endedAt ? 'Đã kết thúc' : 'Đang làm'}
                      </span>
                    </td>
                    {canCloseSessions && (
                      <td className="px-4 py-3 text-right">
                        {!s.endedAt && (
                          <button
                            type="button"
                            onClick={() => handleCloseSession(s.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Kết thúc ca
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Nhân viên vận hành
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                  <td className="px-4 py-3 font-mono text-stone-600">{emp.username ?? '—'}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[emp.role as Role] ?? emp.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  return layout(content);
}
