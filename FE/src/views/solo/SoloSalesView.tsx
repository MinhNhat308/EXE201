'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrderController } from '@/controllers/order.controller';
import { BRAND } from '@/lib/brand';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { SOLO_HUB_PATH } from '@/lib/workspace-routes';
import { normalizeStatus, Order, OrderStatus } from '@/models/order.model';
import { InvoicePreview } from '@/views/staff/InvoicePreview';
import { SoloShellLayout } from './SoloShellLayout';
import { getStoredTenant } from '@/lib/auth-storage';
import { TenantInfo } from '@/models/tenant.model';

export function SoloSalesView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const tenant = getStoredTenant<TenantInfo>();

  const load = useCallback(async (skipCache = false) => {
    setLoading(true);
    try {
      const data = await OrderController.getToday(undefined, false, undefined, skipCache);
      const completed = data
        .filter((o) => normalizeStatus(o.status) === OrderStatus.COMPLETED)
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        );
      setOrders(completed);
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

  const stats = useMemo(() => {
    const cash = orders.filter((o) => o.paymentMethod === 'CASH');
    const bank = orders.filter((o) => o.paymentMethod === 'BANK_TRANSFER');
    const itemCounts = new Map<string, number>();
    for (const o of orders) {
      for (const line of o.items) {
        itemCounts.set(line.name, (itemCounts.get(line.name) ?? 0) + line.quantity);
      }
    }
    const topItems = [...itemCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      count: orders.length,
      revenue: orders.reduce((s, o) => s + (o.total ?? 0), 0),
      cashTotal: cash.reduce((s, o) => s + (o.total ?? 0), 0),
      bankTotal: bank.reduce((s, o) => s + (o.total ?? 0), 0),
      topItems,
    };
  }, [orders]);

  const handlePrint = () => window.print();

  return (
    <SoloShellLayout title="Hóa đơn & doanh thu" backHref={SOLO_HUB_PATH}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 print:py-0">
        <div className="grid gap-3 sm:grid-cols-3 print:hidden">
          <StatCard label="Đơn hoàn thành" value={String(stats.count)} />
          <StatCard label="Doanh thu" value={formatCurrency(stats.revenue)} highlight />
          <StatCard
            label="TM / CK"
            value={`${formatCurrency(stats.cashTotal)} / ${formatCurrency(stats.bankTotal)}`}
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
          <h2 className="text-sm font-semibold text-stone-800">Hóa đơn hôm nay</h2>
          {loadError && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 ring-1 ring-red-100">
              {loadError}
            </p>
          )}
          {loading ? (
            <p className="mt-4 text-sm text-stone-500">Đang tải...</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              Chưa có đơn hoàn thành hôm nay. Hãy bán ly đầu tiên ở màn Bán hàng.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {orders.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(o)}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-left transition hover:border-[#2F80ED]/30 hover:shadow-sm ${
                      selected?.id === o.id ? 'border-[#2F80ED]/40 ring-1 ring-[#2F80ED]/20' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-stone-800">
                        {o.invoiceNumber}
                      </span>
                      <span className="font-bold text-amber-700">{formatCurrency(o.total)}</span>
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
        </div>

        {selected && (
          <div className="mt-6 space-y-4 print:mt-0">
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold ${BRAND.primarySoft}`}
              >
                In lại hóa đơn
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
