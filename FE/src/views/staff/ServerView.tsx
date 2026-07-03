'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePolling } from '@/lib/use-polling';
import { useRouter } from 'next/navigation';
import { OrderController } from '@/controllers/order.controller';
import { getStoredUser } from '@/lib/auth-storage';
import { canAccessRole, isStoreOwner } from '@/lib/role-access';
import { formatToppingsLabel } from '@/lib/cart';
import { formatSugarIceLine } from '@/lib/sugar-ice';
import { formatCurrency } from '@/lib/format';
import { resolveStaffSession, endStaffSessionRemote } from '@/lib/staff-session-storage';
import { STORE_CHECK_IN_PATH } from '@/lib/workspace-routes';
import {
  Order,
  OrderStatus,
  normalizeStatus,
} from '@/models/order.model';
import {
  WORK_ROLE_LABELS,
  WORK_SHIFT_LABELS,
  WorkRole,
} from '@/models/staff.model';
import { BRAND } from '@/lib/brand';
import { Role, User } from '@/models/user.model';
import { StaffLayout } from '@/views/staff/StaffLayout';
import { OrderStatusBadge } from '@/views/orders/OrderStatusBadge';

export function ServerView() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session] = useState(() => resolveStaffSession(WorkRole.SERVER));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!session) return;
      if (!silent) setLoading(true);
      try {
        const data = await OrderController.getToday(session.workShift, true);
        const ready = data.filter(
          (o) => normalizeStatus(o.status) === OrderStatus.READY,
        );
        setOrders(ready);
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
    if (!session || session.workRole !== WorkRole.SERVER) {
      if (!isStoreOwner(stored.role)) {
        router.replace(STORE_CHECK_IN_PATH);
      }
      return;
    }
    setUser((prev) => {
      if (prev && prev.email === stored.email) return prev;
      return stored;
    });
    void loadOrders(false);
  }, [router, session, loadOrders]);

  usePolling(() => loadOrders(true), 12_000, !!user && !!session);

  const handleComplete = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await OrderController.updateStatus(orderId, OrderStatus.COMPLETED);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
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
            <p className="text-xs font-medium text-white/80">
              {WORK_ROLE_LABELS[WorkRole.SERVER]} ·{' '}
              {WORK_SHIFT_LABELS[session.workShift]}
            </p>
            <h1 className="text-lg font-bold">Đơn chờ phục vụ</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadOrders()}
              className="rounded-lg bg-white/20 px-3 py-1 text-sm hover:bg-white/30"
            >
              🔄 Làm mới
            </button>
            <button
              type="button"
              onClick={() => {
                void endStaffSessionRemote();
                router.push(STORE_CHECK_IN_PATH);
              }}
              className="rounded-lg bg-white/20 px-3 py-1 text-sm hover:bg-white/30"
            >
              Đổi ca
            </button>
          </div>
        </div>
      </div>

      <div>
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-stone-500">Đang tải...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-4xl">🍹</p>
            <p className="mt-3 text-stone-500">Chưa có đơn sẵn sàng phục vụ</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border-2 border-emerald-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-bold">#{order.orderNumber}</p>
                    <p className="text-xs text-stone-400">HĐ {order.invoiceNumber}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="mt-3 text-sm">
                  <p>Bàn: <strong>{order.tableNumber}</strong></p>
                  {order.customerName && <p>Khách: {order.customerName}</p>}
                </div>

                <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name}
                        {item.toppings?.length > 0 && (
                          <span className="block text-xs text-violet-600">
                            + {formatToppingsLabel(item.toppings)}
                          </span>
                        )}
                        {(item.sugarPercent != null || item.icePercent != null) && (
                          <span className="block text-xs text-sky-600">
                            🧊 {formatSugarIceLine(item.sugarPercent, item.icePercent)}
                          </span>
                        )}
                        {item.note && (
                          <span className="block text-xs text-amber-700">📝 {item.note}</span>
                        )}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="font-bold text-amber-700">
                    {formatCurrency(order.total)}
                  </span>
                  <button
                    onClick={() => handleComplete(order.id)}
                    disabled={updatingId === order.id}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {updatingId === order.id ? '...' : 'Đã giao khách'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </StaffLayout>
  );
}
