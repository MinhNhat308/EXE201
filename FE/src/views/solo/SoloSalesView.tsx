'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderController } from '@/controllers/order.controller';
import { BRAND } from '@/lib/brand';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { SOLO_HUB_PATH } from '@/lib/workspace-routes';
import {
  normalizeStatus,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  Order,
  OrderStatus,
} from '@/models/order.model';
import { InvoicePreview } from '@/views/staff/InvoicePreview';
import { SoloShellLayout } from './SoloShellLayout';
import { getStoredTenant } from '@/lib/auth-storage';
import { TenantInfo } from '@/models/tenant.model';

export function SoloSalesView() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('order');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const tenant = getStoredTenant<TenantInfo>();

  const load = useCallback(async (skipCache = false) => {
    setLoading(true);
    try {
      const data = await OrderController.getToday(undefined, false, undefined, skipCache);
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      );
      setOrders(sorted);
      setLoadError('');
    } catch (err) {
      setOrders([]);
      setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách đơn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  useEffect(() => {
    if (!highlightId || orders.length === 0) return;
    const hit = orders.find((o) => o.id === highlightId);
    if (hit) setSelected(hit);
  }, [highlightId, orders]);

  const pendingOrders = useMemo(
    () =>
      orders.filter((o) => {
        const s = normalizeStatus(o.status);
        return s === OrderStatus.PENDING || s === OrderStatus.PREPARING;
      }),
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => normalizeStatus(o.status) === OrderStatus.COMPLETED),
    [orders],
  );

  const stats = useMemo(() => {
    const cash = completedOrders.filter((o) => o.paymentMethod === 'CASH');
    const bank = completedOrders.filter((o) => o.paymentMethod === 'BANK_TRANSFER');
    const itemCounts = new Map<string, number>();
    for (const o of completedOrders) {
      for (const line of o.items) {
        itemCounts.set(line.name, (itemCounts.get(line.name) ?? 0) + line.quantity);
      }
    }
    const topItems = [...itemCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      count: completedOrders.length,
      pendingCount: pendingOrders.length,
      revenue: completedOrders.reduce((s, o) => s + (o.total ?? 0), 0),
      cashTotal: cash.reduce((s, o) => s + (o.total ?? 0), 0),
      bankTotal: bank.reduce((s, o) => s + (o.total ?? 0), 0),
      topItems,
    };
  }, [completedOrders, pendingOrders]);

  const handleComplete = async (orderId: string) => {
    setCompletingId(orderId);
    setLoadError('');
    try {
      const updated = await OrderController.completeSoloSale(orderId);
      await load(true);
      setSelected(updated);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không hoàn tất được đơn');
    } finally {
      setCompletingId(null);
    }
  };

  const handlePrint = () => window.print();

  return (
    <SoloShellLayout title="Hóa đơn & doanh thu" backHref={SOLO_HUB_PATH}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 print:py-0">
        <div className="grid gap-3 sm:grid-cols-3 print:hidden">
          <StatCard label="Đơn hoàn thành" value={String(stats.count)} />
          <StatCard label="Doanh thu" value={formatCurrency(stats.revenue)} highlight />
          <StatCard
            label="Chờ chốt / TM·CK"
            value={`${stats.pendingCount} · ${formatCurrency(stats.cashTotal)} / ${formatCurrency(stats.bankTotal)}`}
            small
          />
        </div>

        {stats.topItems.length > 0 && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 print:hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Bán chạy hôm nay
            </p>
            <ul className="mt-2 space-y-1">
              {stats.topItems.map(([name, qty]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="text-stone-700">{name}</span>
                  <span className="font-semibold text-stone-900">{qty} ly</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 print:hidden">
          {loadError && (
            <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 ring-1 ring-red-100">
              {loadError}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-stone-500">Đang tải...</p>
          ) : orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              Chưa có hóa đơn hôm nay. Hãy bán ly đầu tiên ở màn Bán hàng.
            </p>
          ) : (
            <div className="space-y-6">
              {pendingOrders.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-stone-800">
                    Chờ hoàn tất ({pendingOrders.length})
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Đơn mới lưu ở trạng thái chờ — bấm Hoàn tất để chốt doanh thu.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {pendingOrders.map((o) => (
                      <li
                        key={o.id}
                        className={`rounded-xl border bg-white p-4 ${
                          selected?.id === o.id
                            ? 'border-[#2F80ED]/40 ring-1 ring-[#2F80ED]/20'
                            : 'border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelected(o)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-stone-800">
                                {o.invoiceNumber}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${ORDER_STATUS_COLORS[o.status] ?? ''}`}
                              >
                                {ORDER_STATUS_LABELS[o.status] ?? o.status}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-stone-400">
                              {o.createdAt ? formatDateTime(o.createdAt) : '—'}
                              {o.paymentMethod === 'CASH' ? ' · Tiền mặt' : ' · Chuyển khoản'}
                            </p>
                            <p className="mt-1 font-bold text-amber-700">
                              {formatCurrency(o.total)}
                            </p>
                          </button>
                          <button
                            type="button"
                            disabled={completingId === o.id}
                            onClick={() => void handleComplete(o.id)}
                            className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                          >
                            {completingId === o.id ? '...' : 'Hoàn tất'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h2 className="text-sm font-semibold text-stone-800">
                  Đã chốt ({completedOrders.length})
                </h2>
                {completedOrders.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-500">
                    Chưa có đơn hoàn tất — chốt đơn ở mục trên để tính doanh thu.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {completedOrders.map((o) => (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(o)}
                          className={`w-full rounded-xl border bg-white px-4 py-3 text-left transition hover:border-[#2F80ED]/30 hover:shadow-sm ${
                            selected?.id === o.id
                              ? 'border-[#2F80ED]/40 ring-1 ring-[#2F80ED]/20'
                              : 'border-stone-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-semibold text-stone-800">
                              {o.invoiceNumber}
                            </span>
                            <span className="font-bold text-amber-700">
                              {formatCurrency(o.total)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-stone-400">
                            {o.createdAt ? formatDateTime(o.createdAt) : '—'}
                            {o.paymentMethod === 'CASH' ? ' · Tiền mặt' : ' · Chuyển khoản'}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-6 space-y-4 print:mt-0">
            <div className="flex gap-2 print:hidden">
              {normalizeStatus(selected.status) !== OrderStatus.COMPLETED && (
                <button
                  type="button"
                  disabled={completingId === selected.id}
                  onClick={() => void handleComplete(selected.id)}
                  className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  {completingId === selected.id ? 'Đang chốt...' : 'Hoàn tất đơn'}
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold ${BRAND.primarySoft}`}
              >
                In hóa đơn
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600"
              >
                Đóng
              </button>
            </div>
            <InvoicePreview
              printable
              storeName={tenant?.storeName}
              invoiceNumber={selected.invoiceNumber}
              orderNumber={selected.orderNumber}
              items={selected.items}
              customerName={selected.customerName}
              customerPhone={selected.customerPhone}
              tableNumber={selected.tableNumber}
              note={selected.note}
              paymentMethod={selected.paymentMethod}
              staffName={selected.staffName}
              subtotal={selected.subtotal}
              total={selected.total}
              createdAt={selected.createdAt}
            />
          </div>
        )}
      </main>
    </SoloShellLayout>
  );
}

function StatCard({
  label,
  value,
  highlight,
  small,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p
        className={`mt-1 font-bold text-stone-900 ${small ? 'text-sm' : 'text-lg'} ${highlight ? 'text-[#2F80ED]' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
