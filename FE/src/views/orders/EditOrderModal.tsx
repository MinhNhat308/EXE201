'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { OrderController } from '@/controllers/order.controller';
import { getStoredTenant } from '@/lib/auth-storage';
import { formatToppingsLabel, cartSubtotal } from '@/lib/cart';
import { formatCurrency } from '@/lib/format';
import {
  formatSugarIceLine,
  posSugarIceEnabled,
  resolveIceLevels,
  resolveSugarLevels,
} from '@/lib/sugar-ice';
import { MenuItem } from '@/models/menu.model';
import { Order, OrderLineItem } from '@/models/order.model';
import { TenantInfo } from '@/models/tenant.model';
import { Modal } from '@/views/components/Modal';
import { SugarIceModal } from '@/views/staff/SugarIceModal';

interface EditOrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  soloMode?: boolean;
}

function lineToMenuStub(item: OrderLineItem): MenuItem {
  return {
    id: item.menuItemId,
    name: item.name,
    category: '',
    price: item.basePrice,
    isAvailable: true,
    toppings: item.toppings ?? [],
  };
}

export function EditOrderModal({
  order,
  open,
  onClose,
  onSaved,
  soloMode = false,
}: EditOrderModalProps) {
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const tenant = getStoredTenant<TenantInfo>();
  const sugarIceOpts = posSugarIceEnabled(tenant);
  const sugarLevels = resolveSugarLevels(tenant);
  const iceLevels = resolveIceLevels(tenant);

  const editingLine = editingIdx != null ? items[editingIdx] : null;

  useEffect(() => {
    if (!order) return;
    setItems(order.items.map((i) => ({ ...i })));
    setCustomerName(order.customerName ?? '');
    setCustomerPhone(order.customerPhone ?? '');
    setTableNumber(order.tableNumber ?? '');
    setNote(order.note ?? '');
    setEditingIdx(null);
  }, [order]);

  const subtotal = cartSubtotal(
    items.map((i, idx) => ({
      cartLineId: String(idx),
      menuItemId: i.menuItemId,
      name: i.name,
      basePrice: i.basePrice,
      toppings: i.toppings,
      price: i.price,
      quantity: i.quantity,
      sugarPercent: i.sugarPercent,
      icePercent: i.icePercent,
    })),
  );

  const updateQty = (index: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const applySugarIce = (sugarPercent: number, icePercent: number) => {
    if (editingIdx == null) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === editingIdx ? { ...item, sugarPercent, icePercent } : item,
      ),
    );
    setEditingIdx(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!order || items.length === 0) {
      setError('Đơn phải có ít nhất 1 món');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await OrderController.update(order.id, {
        items,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        tableNumber: tableNumber || undefined,
        note: note || undefined,
        subtotal,
        total: subtotal,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const sugarIceModalItem = useMemo(
    () => (editingLine ? lineToMenuStub(editingLine) : null),
    [editingLine],
  );

  return (
    <>
      <Modal open={open} onClose={onClose} className="max-w-lg">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold">
            {soloMode ? 'Sửa hóa đơn' : 'Sửa đơn'} #{order?.invoiceNumber ?? order?.orderNumber}
          </h2>
          <p className="text-xs text-stone-500">
            {soloMode
              ? 'Chỉnh món, số lượng hoặc thông tin trên hóa đơn đã lưu'
              : 'Chỉ sửa được khi bếp chưa bắt đầu làm'}
          </p>

          <div className="mt-4 space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-lg border border-stone-100 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.toppings?.length > 0 && (
                    <p className="text-xs text-violet-600">
                      + {formatToppingsLabel(item.toppings)}
                    </p>
                  )}
                  {(item.sugarPercent != null || item.icePercent != null) && (
                    <p className="text-xs text-sky-600">
                      {formatSugarIceLine(item.sugarPercent, item.icePercent)}
                    </p>
                  )}
                  {sugarIceOpts.any && (
                    <button
                      type="button"
                      onClick={() => setEditingIdx(idx)}
                      className="mt-1 text-xs font-semibold text-[#2F80ED] hover:underline"
                    >
                      Sửa đường/đá
                    </button>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQty(idx, -1)}
                    className="h-7 w-7 rounded bg-stone-100"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(idx, 1)}
                    className="h-7 w-7 rounded bg-stone-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Tên khách"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="SĐT"
            />
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Số bàn"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              rows={2}
              placeholder="Ghi chú"
            />
          </div>

          <p className="mt-3 text-right font-bold text-amber-600">
            Tổng: {formatCurrency(subtotal)}
          </p>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border py-2.5">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#2F80ED] py-2.5 font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      <SugarIceModal
        item={sugarIceModalItem}
        toppings={editingLine?.toppings ?? []}
        enableSugar={sugarIceOpts.sugar}
        enableIce={sugarIceOpts.ice}
        sugarLevels={sugarLevels}
        iceLevels={iceLevels}
        onClose={() => setEditingIdx(null)}
        onConfirm={applySugarIce}
      />
    </>
  );
}
