'use client';

import { Order, OrderStatus, normalizeStatus } from '@/models/order.model';
import { sortKitchenOrders, type KitchenSortMode } from '@/lib/kitchen-order-utils';
import { KitchenOrderCard, type KitchenCardDensity } from './KitchenOrderCard';

const COLUMNS: {
  status: OrderStatus.PENDING | OrderStatus.PREPARING | OrderStatus.READY;
  title: string;
  hint: string;
  headerClass: string;
  columnAccent: string;
}[] = [
  {
    status: OrderStatus.PENDING,
    title: 'Chưa làm',
    hint: 'Cuộn xem thêm · cũ nhất ở trên',
    headerClass: 'border-amber-200 bg-amber-50 text-amber-900',
    columnAccent: 'border-t-4 border-t-amber-400',
  },
  {
    status: OrderStatus.PREPARING,
    title: 'Đang làm',
    hint: 'Cuộn xem thêm · ưu tiên đơn chờ lâu',
    headerClass: 'border-sky-200 bg-sky-50 text-sky-900',
    columnAccent: 'border-t-4 border-t-sky-400',
  },
  {
    status: OrderStatus.READY,
    title: 'Sẵn sàng bưng',
    hint: 'Chờ phục vụ · cuộn nếu nhiều đơn',
    headerClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    columnAccent: 'border-t-4 border-t-emerald-400',
  },
];

export function KitchenKanbanBoard({
  orders,
  sortMode,
  density,
  kdsMode,
  updatingId,
  onAdvance,
  onOpen,
}: {
  orders: Order[];
  sortMode: KitchenSortMode;
  density: KitchenCardDensity;
  kdsMode: boolean;
  updatingId: string | null;
  onAdvance: (order: Order) => void;
  onOpen: (order: Order) => void;
}) {
  const totalActive = orders.filter((o) => {
    const s = normalizeStatus(o.status);
    return s !== OrderStatus.COMPLETED && s !== OrderStatus.CANCELLED;
  }).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {totalActive > 8 && (
        <p className="mb-2 shrink-0 text-center text-xs text-stone-500">
          {totalActive} đơn đang xử lý — mỗi cột cuộn độc lập
          {density === 'compact' ? ' · chế độ gọn' : ' · bật "Gọn" nếu quá nhiều đơn'}
        </p>
      )}

      <div
        className={`grid min-h-0 flex-1 gap-3 ${
          kdsMode
            ? 'h-full grid-cols-3'
            : 'h-[min(72vh,calc(100vh-13rem))] grid-cols-1 md:grid-cols-3'
        }`}
      >
        {COLUMNS.map((col) => {
          const colOrders = sortKitchenOrders(
            orders.filter((o) => normalizeStatus(o.status) === col.status),
            sortMode,
          );

          return (
            <section
              key={col.status}
              className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/90 shadow-sm ${col.columnAccent}`}
            >
              <header
                className={`shrink-0 border-b px-3 py-2.5 ${col.headerClass}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold sm:text-base">{col.title}</h2>
                  <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white/90 px-2 text-xs font-bold shadow-sm">
                    {colOrders.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] opacity-75 sm:text-xs">{col.hint}</p>
              </header>

              <div
                className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${
                  density === 'compact' ? 'space-y-1.5 p-2' : 'space-y-2.5 p-2.5'
                }`}
              >
                {colOrders.length === 0 ? (
                  <p className="py-10 text-center text-sm text-stone-400">Không có đơn</p>
                ) : (
                  colOrders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      density={density}
                      kdsMode={kdsMode}
                      updating={updatingId === order.id}
                      onAdvance={() => onAdvance(order)}
                      onOpen={() => onOpen(order)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
