'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePolling } from '@/lib/use-polling';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderController } from '@/controllers/order.controller';
import { getStoredUser } from '@/lib/auth-storage';
import { canAccessRole, isStoreOwner } from '@/lib/role-access';
import { resolveStaffSession } from '@/lib/staff-session-storage';
import { STORE_CHECK_IN_PATH, STORE_CASHIER_POS_PATH } from '@/lib/workspace-routes';
import {
  isPendingStatus,
  normalizeStatus,
  Order,
  OrderStatus,
} from '@/models/order.model';
import {
  WORK_ROLE_LABELS,
  WORK_SHIFT_LABELS,
  WorkRole,
} from '@/models/staff.model';
import { BRAND } from '@/lib/brand';
import { Role, User } from '@/models/user.model';
import { StaffLayout } from '@/views/staff/StaffLayout';
import { OrderGridCard } from '@/views/orders/OrderGridCard';
import { OrderBillDetail } from '@/views/orders/OrderBillDetail';
import { OrderStatusBadge } from '@/views/orders/OrderStatusBadge';
import { CancelOrderModal } from '@/views/orders/CancelOrderModal';
import { EditOrderModal } from '@/views/orders/EditOrderModal';

type FilterKey =
  | 'all'
  | OrderStatus.PENDING
  | OrderStatus.PREPARING
  | OrderStatus.READY
  | OrderStatus.COMPLETED
  | OrderStatus.CANCELLED;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: OrderStatus.PENDING, label: 'Chưa thực hiện' },
  { key: OrderStatus.PREPARING, label: 'Đang thực hiện' },
  { key: OrderStatus.READY, label: 'Sẵn sàng bưng' },
  { key: OrderStatus.COMPLETED, label: 'Đã giao khách' },
  { key: OrderStatus.CANCELLED, label: 'Đã hủy' },
];

export function CashierOrdersView() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session] = useState(() => resolveStaffSession(WorkRole.CASHIER));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (!session) return;
      if (!silent) setLoading(true);
      try {
        const data = await OrderController.getToday(session.workShift, false);
        setOrders(data);
        setError('');
      } catch {
        if (!silent) setError('Không tải được danh sách đơn');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session],
  );

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || !canAccessRole(stored.role, Role.STAFF)) {
      router.replace('/login');
      return;
    }
    if (!session || session.workRole !== WorkRole.CASHIER) {
      if (!isStoreOwner(stored.role)) {
        router.replace(STORE_CHECK_IN_PATH);
      }
      return;
    }
    setUser((prev) => {
      if (prev && prev.email === stored.email) return prev;
      return stored;
    });
    void load(false);
  }, [router, session, load]);

  usePolling(() => load(true), 15_000, !!user && !!session);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => normalizeStatus(o.status) === filter);
  }, [orders, filter]);

  const canModify = selected ? isPendingStatus(selected.status) : false;

  const handleCancel = async (reason: string) => {
    if (!selected) return;
    await OrderController.cancel(selected.id, reason);
    setSelected(null);
    await load();
  };

  if (!user || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-500">
        Đang tải...
      </div>
    );
  }

  return (
    <StaffLayout>
    <div className="space-y-4">
      <div
        className={`rounded-xl bg-gradient-to-r ${BRAND.headerGradient} px-5 py-4 text-white`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-white/80">
              {WORK_ROLE_LABELS[WorkRole.CASHIER]} · {WORK_SHIFT_LABELS[session.workShift]}
            </p>
            <h1 className="text-lg font-bold">Hóa đơn hôm nay</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-sm hover:bg-white/30"
            >
              🔄
            </button>
            <Link
              href={STORE_CASHIER_POS_PATH}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#2F80ED] hover:bg-white/90"
            >
              🛒 Bán hàng
            </Link>
          </div>
        </div>
      </div>

      <div>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? `${BRAND.primary} text-white`
                  : 'bg-white text-stone-600 ring-1 ring-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            {loading ? (
              <p className="text-stone-400">Đang tải...</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-2xl bg-white p-12 text-center text-stone-400">
                Không có đơn nào
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((order) => (
                  <OrderGridCard
                    key={order.id}
                    order={order}
                    selected={selected?.id === order.id}
                    onClick={() => setSelected(order)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-4 lg:h-fit">
            {selected ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold">Chi tiết đơn</h2>
                  <OrderStatusBadge status={selected.status} />
                </div>
                <OrderBillDetail order={selected} />

                {canModify ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-emerald-600">
                      ✓ Bếp chưa làm — có thể sửa hoặc hủy đơn
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-900"
                    >
                      Sửa đơn / món
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelOpen(true)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
                    >
                      Hủy đơn
                    </button>
                  </div>
                ) : selected.status === OrderStatus.CANCELLED ? (
                  <p className="mt-4 text-sm text-red-600">Đơn đã hủy</p>
                ) : (
                  <p className="mt-4 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-500">
                    Bếp đã nhận đơn — không thể sửa hoặc hủy.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-white/60 p-8 text-center text-sm text-stone-400">
                Chọn một đơn để xem chi tiết
              </div>
            )}
          </aside>
        </div>
      </div>

      <EditOrderModal
        order={selected}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />
      <CancelOrderModal
        order={selected}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />
    </div>
    </StaffLayout>
  );
}
