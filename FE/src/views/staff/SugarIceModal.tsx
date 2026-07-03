'use client';

import { useEffect, useState } from 'react';
import { unitPrice } from '@/lib/cart';
import { formatCurrency } from '@/lib/format';
import {
  defaultLevelFromPresets,
  iceChoiceLabel,
  sugarChoiceLabel,
} from '@/lib/sugar-ice';
import { MenuItem, Topping } from '@/models/menu.model';
import { Modal } from '@/views/components/Modal';

interface SugarIceModalProps {
  item: MenuItem | null;
  toppings: Topping[];
  enableSugar: boolean;
  enableIce: boolean;
  sugarLevels: number[];
  iceLevels: number[];
  onClose: () => void;
  onConfirm: (sugarPercent: number, icePercent: number) => void;
}

function PresetGrid({
  label,
  emoji,
  value,
  enabled,
  presets,
  onChange,
  labelFn,
}: {
  label: string;
  emoji: string;
  value: number;
  enabled: boolean;
  presets: number[];
  onChange: (v: number) => void;
  labelFn: (p: number) => string;
}) {
  if (!enabled) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {emoji} {label}
      </p>
      <p className="mt-0.5 text-sm text-stone-600">
        Đang chọn: <strong>{value}%</strong> · {labelFn(value)}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-xl border-2 py-2.5 text-center text-sm font-bold transition ${
              value === p
                ? 'border-[#2F80ED] bg-[#2F80ED]/10 text-[#2F80ED]'
                : 'border-stone-100 bg-stone-50 text-stone-700 hover:border-[#2F80ED]/40'
            }`}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}

export function SugarIceModal({
  item,
  toppings,
  enableSugar,
  enableIce,
  sugarLevels,
  iceLevels,
  onClose,
  onConfirm,
}: SugarIceModalProps) {
  const [sugar, setSugar] = useState(() => defaultLevelFromPresets(sugarLevels));
  const [ice, setIce] = useState(() => defaultLevelFromPresets(iceLevels));

  useEffect(() => {
    setSugar(defaultLevelFromPresets(sugarLevels));
    setIce(defaultLevelFromPresets(iceLevels));
  }, [item?.id, sugarLevels, iceLevels]);

  if (!item) return null;

  const total = unitPrice(item.price, toppings);

  return (
    <Modal open={!!item} onClose={onClose} className="max-w-lg">
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-200">
        <div className="bg-gradient-to-r from-[#2F80ED] to-sky-500 px-5 py-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">
            Đường · Đá theo khách
          </p>
          <h3 className="text-lg font-bold leading-snug">{item.name}</h3>
          <p className="mt-1 text-sm text-white/90">
            Công thức quán = 100% — chọn mức quán đã cấu hình · {formatCurrency(total)}
          </p>
        </div>

        <div className="max-h-[55vh] space-y-5 overflow-y-auto p-5">
          <PresetGrid
            label="Tỷ lệ đường"
            emoji="🍬"
            value={sugar}
            enabled={enableSugar}
            presets={sugarLevels}
            onChange={setSugar}
            labelFn={sugarChoiceLabel}
          />
          <PresetGrid
            label="Tỷ lệ đá"
            emoji="🧊"
            value={ice}
            enabled={enableIce}
            presets={iceLevels}
            onChange={setIce}
            labelFn={iceChoiceLabel}
          />
          {!enableSugar && !enableIce && (
            <p className="text-sm text-stone-500">
              Bật chọn đường/đá trong Cài đặt → tab Định lượng.
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-stone-100 bg-stone-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm(enableSugar ? sugar : 100, enableIce ? ice : 100)
            }
            className="flex-1 rounded-xl bg-[#2F80ED] py-3 text-sm font-bold text-white hover:bg-[#2563c7]"
          >
            Thêm vào đơn
          </button>
        </div>
      </div>
    </Modal>
  );
}
