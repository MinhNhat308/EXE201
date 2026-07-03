'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { unitPrice } from '@/lib/cart';
import { MenuItem, Topping } from '@/models/menu.model';
import { Modal } from '@/views/components/Modal';

interface ToppingModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (toppings: Topping[]) => void;
}

export function ToppingModal({ item, onClose, onConfirm }: ToppingModalProps) {
  const [selected, setSelected] = useState<Topping[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [item?.id]);

  if (!item) return null;

  const available = item.toppings ?? [];
  const total = unitPrice(item.price, selected);

  const toggle = (topping: Topping) => {
    setSelected((prev) => {
      const exists = prev.some((t) => t.name === topping.name);
      if (exists) return prev.filter((t) => t.name !== topping.name);
      return [...prev, topping];
    });
  };

  return (
    <Modal open={!!item} onClose={onClose} className="max-w-md">
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-200">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-100">
            Tùy chọn topping
          </p>
          <h3 className="text-lg font-bold leading-snug">{item.name}</h3>
          <p className="mt-1 text-sm text-amber-100">
            Giá gốc {formatCurrency(item.price)}
            {selected.length > 0 && ` · Tạm tính ${formatCurrency(total)}`}
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-4">
          {available.length === 0 ? (
            <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
              Món này không có topping. Nhấn <strong>Không</strong> để thêm vào bill.
            </p>
          ) : (
            <div className="grid gap-2">
              {available.map((topping) => {
                const isOn = selected.some((t) => t.name === topping.name);
                return (
                  <button
                    key={topping.name}
                    type="button"
                    onClick={() => toggle(topping)}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${
                      isOn
                        ? 'border-[#2F80ED] bg-amber-50'
                        : 'border-stone-100 hover:border-amber-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border-2 text-xs ${
                          isOn
                            ? 'border-[#2F80ED] bg-[#2F80ED] text-white'
                            : 'border-stone-300'
                        }`}
                      >
                        {isOn ? '✓' : ''}
                      </span>
                      <span className="font-medium text-stone-800">{topping.name}</span>
                    </span>
                    <span className="text-sm font-semibold text-amber-600">
                      +{formatCurrency(topping.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-stone-100 bg-stone-50 p-4">
          <button
            type="button"
            onClick={() => onConfirm([])}
            className="flex-1 rounded-xl border-2 border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Không
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            disabled={available.length > 0 && selected.length === 0}
            className="flex-1 rounded-xl bg-[#2F80ED] py-3 text-sm font-bold text-white transition hover:bg-[#2569c7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Thêm
          </button>
        </div>
      </div>
    </Modal>
  );
}
