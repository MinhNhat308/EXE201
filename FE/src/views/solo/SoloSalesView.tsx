'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderController } from '@/controllers/order.controller';
import { BRAND } from '@/lib/brand';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { SOLO_HUB_PATH } from '@/lib/workspace-routes';
import { normalizeStatus, Order, OrderStatus } from '@/models/order.model';
import { CancelOrderModal } from '@/views/orders/CancelOrderModal';
import { EditOrderModal } from '@/views/orders/EditOrderModal';
import { InvoicePreview } from '@/views/staff/InvoicePreview';
import { SoloShellLayout } from './SoloShellLayout';
import { getStoredTenant } from '@/lib/auth-storage';
import { TenantInfo } from '@/models/tenant.model';

/** Solo: mọi hóa đơn đã lưu (trừ hủy) đều tính doanh thu */
function isSoloRevenueOrder(o: Order): boolean {
  return normalizeStatus(o.status) !== OrderStatus.CANCELLED;
}

export function SoloSalesView() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('order');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const tenant = getStoredTenant<TenantInfo>();

  const load = useCallback(async (skipCache = false) => {
    setLoading(true);
    try {
      const data = await OrderController.getToday(undefined, false, undefined, skipCache);
      const revenueOrders = data
        .filter(isSoloRevenueOrder)
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        );
      setOrders(revenueOrders);
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

  const handleSaved = async () => {
    if (!selected) return;
    try {
      const updated = await OrderController.getById(selected.id);
      setSelected(updated);
    } catch {
      setSelected(null);
    }
    setEditOpen(false);
    await load(true);
  };

  const handleCancel = async (reason: string) => {
    if (!selected) return;
    await OrderController.cancel(selected.id, reason);
    setSelected(null);
    setCancelOpen(false);
    await load(true);
  };

  const canModifySelected =
    selected != null && normalizeStatus(selected.status) !== OrderStatus.CANCELLED;
  const canCancelSelected =
    canModifySelected && selected?.paymentMethod !== 'BANK_TRANSFER';

  return (
    <SoloShellLayout title="Hóa đơn & doanh thu" backHref={SOLO_HUB_PATH}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 print:py-0">
        <div className="grid gap-3 sm:grid-cols-3 print:hidden">
          <StatCard label="Hóa đơn hôm nay" value={String(stats.count)} />
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
          <h2 className="text-sm font-semibold text-stone-800">Danh sách hóa đơn</h2>
          {loadError && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 ring-1 ring-red-100">
              {loadError}
            </p>
          )}
          {loading ? (
            <p className="mt-4 text-sm text-stone-500">Đang tải...</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              Chưa có hóa đơn hôm nay. Hãy bán ly đầu tiên ở màn Bán hàng.
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
            <div className="flex flex-wrap gap-2 print:hidden">
              {canModifySelected && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex-1 rounded-xl border border-amber-300 bg-amber-50 py-3 text-sm font-semibold text-amber-900 min-w-[120px]"
                >
                  Sửa hóa đơn
                </button>
              )}
              {canCancelSelected && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 min-w-[120px]"
                >
                  Hủy hóa đơn
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold ${BRAND.primarySoft} min-w-[120px]`}
              >
                In lại
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600"
              >
                Đóng
              </button>
            </div>
            {selected.paymentMethod === 'BANK_TRANSFER' && canModifySelected && (
              <p className="text-xs text-stone-500 print:hidden">
                Hóa đơn chuyển khoản không thể hủy — chỉ sửa thông tin nếu cần.
              </p>
            )}
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

      <EditOrderModal
        order={selected}
        open={editOpen}
        soloMode
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />
      <CancelOrderModal
        order={selected}
        open={cancelOpen}
        soloMode
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />
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
