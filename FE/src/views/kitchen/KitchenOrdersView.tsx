'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePolling } from '@/lib/use-polling';
import { useRouter } from 'next/navigation';
import { OrderController } from '@/controllers/order.controller';
import { getStoredUser } from '@/lib/auth-storage';
import { canAccessRole, isStoreOwner } from '@/lib/role-access';
import {
  kitchenStatusCounts,
  nextKitchenStatus,
  type KitchenSortMode,
} from '@/lib/kitchen-order-utils';
import { useKitchenNewOrderAlert } from '@/lib/use-kitchen-new-order-alert';
import { useStableStaffSession } from '@/lib/use-staff-session';
import { STORE_CHECK_IN_PATH } from '@/lib/workspace-routes';
import {
  normalizeStatus,
  Order,
  OrderStatus,
} from '@/models/order.model';
import { Role, User } from '@/models/user.model';
import { KitchenLayout } from './KitchenLayout';
import { KitchenKanbanBoard } from './KitchenKanbanBoard';
import { KitchenKdsFullscreenShell, KitchenKdsHeader, type KitchenCardDensity } from './KitchenKdsHeader';
import { KitchenOrderModal, KitchenToast } from './KitchenOrderModal';

const KDS_STORAGE_KEY = 'kitchen_kds_mode';
const SORT_STORAGE_KEY = 'kitchen_sort_mode';
const DENSITY_STORAGE_KEY = 'kitchen_density';

export function KitchenOrdersView() {
  const router = useRouter();
  const { session, refresh } = useStableStaffSession();
  const workShift = session?.checkedInRole === Role.KITCHEN ? session.workShift : undefined;
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [clock, setClock] = useState(0);
  const [kdsMode, setKdsMode] = useState(false);
  const [sortMode, setSortMode] = useState<KitchenSortMode>('fifo');
  const [density, setDensity] = useState<KitchenCardDensity>('compact');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setKdsMode(localStorage.getItem(KDS_STORAGE_KEY) === '1');
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    if (saved === 'takeaway-first' || saved === 'fifo') {
      setSortMode(saved);
    }
    const savedDensity = localStorage.getItem(DENSITY_STORAGE_KEY);
    if (savedDensity === 'compact' || savedDensity === 'comfortable') {
      setDensity(savedDensity);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClock((c) => c + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const counts = useMemo(() => kitchenStatusCounts(orders), [orders]);
  const { toast, dismissToast } = useKitchenNewOrderAlert(counts.pending, ready && !!user);

  const lastSyncLabel = useMemo(() => {
    void clock;
    if (!lastSyncAt) return 'Chưa đồng bộ';
    const sec = Math.floor((Date.now() - lastSyncAt.getTime()) / 1000);
    if (sec < 8) return 'Vừa cập nhật';
    if (sec < 60) return `Cập nhật ${sec}s trước`;
    return `Cập nhật ${Math.floor(sec / 60)} phút trước`;
  }, [lastSyncAt, clock]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await OrderController.getToday(workShift, true);
        setOrders(
          data.filter((o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED),
        );
        setLastSyncAt(new Date());
        setError('');
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error ? err.message : 'Không tải được danh sách đơn',
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [workShift],
  );

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || !canAccessRole(stored.role, Role.KITCHEN)) {
      router.replace('/login');
      return;
    }

    setUser(stored);

    if (isStoreOwner(stored.role)) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void refresh()
      .then((active) => {
        if (cancelled) return;
        if (!active || active.checkedInRole !== Role.KITCHEN) {
          router.replace(STORE_CHECK_IN_PATH);
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Không đồng bộ được ca làm. Kiểm tra Backend đang chạy.');
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router, refresh]);

  useEffect(() => {
    if (!ready || !user) return;
    void load(false);
  }, [ready, user, workShift, load]);

  usePolling(() => load(true), 10_000, ready && !!user && !!workShift);

  const handleAdvance = async (order: Order) => {
    const next = nextKitchenStatus(order.status);
    if (!next) return;

    setUpdatingId(order.id);
    setError('');
    try {
      const updated = await OrderController.updateKitchenStatus(order.id, next);
      if (selected?.id === order.id) setSelected(updated);
      await load(true);
      if (next === OrderStatus.READY) {
        setModalOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleKds = () => {
    setKdsMode((prev) => {
      const next = !prev;
      localStorage.setItem(KDS_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const toggleSort = () => {
    setSortMode((prev) => {
      const next = prev === 'fifo' ? 'takeaway-first' : 'fifo';
      localStorage.setItem(SORT_STORAGE_KEY, next);
      return next;
    });
  };

  const toggleDensity = () => {
    setDensity((prev) => {
      const next = prev === 'compact' ? 'comfortable' : 'compact';
      localStorage.setItem(DENSITY_STORAGE_KEY, next);
      return next;
    });
  };

  if (!user || !ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-stone-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-[#2F80ED]" />
        <p className="text-sm">Đang vào màn bếp...</p>
      </div>
    );
  }

  const header = (
    <KitchenKdsHeader
      workShift={workShift}
      counts={counts}
      lastSyncLabel={lastSyncLabel}
      sortMode={sortMode}
      density={density}
      kdsMode={kdsMode}
      onRefresh={() => void load()}
      onToggleSort={toggleSort}
      onToggleDensity={toggleDensity}
      onToggleKds={toggleKds}
      onExitKds={toggleKds}
    />
  );

  const board = loading && orders.length === 0 ? (
    <p className="py-12 text-center text-stone-500">Đang tải đơn...</p>
  ) : (
    <KitchenKanbanBoard
      orders={orders}
      sortMode={sortMode}
      density={density}
      kdsMode={kdsMode}
      updatingId={updatingId}
      onAdvance={(order) => void handleAdvance(order)}
      onOpen={(order) => {
        setSelected(order);
        setModalOpen(true);
      }}
    />
  );

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <KitchenToast message={toast} onDismiss={dismissToast} />

      {error && (
        <p className="mb-2 shrink-0 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {board}

      <KitchenOrderModal
        order={selected}
        open={modalOpen}
        updating={!!selected && updatingId === selected.id}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onAdvance={() => selected && void handleAdvance(selected)}
      />
    </div>
  );

  if (kdsMode) {
    return (
      <KitchenKdsFullscreenShell header={header}>
        {body}
      </KitchenKdsFullscreenShell>
    );
  }

  return (
    <KitchenLayout>
      <div className="flex h-[calc(100vh-2rem)] min-h-[32rem] flex-col">
        {header}
        {body}
      </div>
    </KitchenLayout>
  );
}
