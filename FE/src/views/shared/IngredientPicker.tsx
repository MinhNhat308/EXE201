'use client';

import { useMemo, useState } from 'react';
import { Ingredient } from '@/models/inventory.model';
import { INGREDIENT_CATEGORY_LABELS } from '@/models/ingredient-category.model';

type Props = {
  ingredients: Ingredient[];
  value: string;
  onChange: (ingredientId: string) => void;
  onAddNew: (searchText: string) => void;
  lastUnitPrice?: number;
};

export function IngredientPicker({
  ingredients,
  value,
  onChange,
  onAddNew,
  lastUnitPrice,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = ingredients.find((i) => i.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.unit.toLowerCase().includes(q) ||
        INGREDIENT_CATEGORY_LABELS[i.category]?.toLowerCase().includes(q),
    );
  }, [ingredients, query]);

  const exactMatch = ingredients.some(
    (i) => i.name.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <div className="relative min-w-[200px] flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm hover:border-blue-300"
      >
        <span className={selected ? 'text-stone-900' : 'text-stone-400'}>
          {selected ? `${selected.name} (${selected.unit})` : 'Chọn nguyên liệu...'}
        </span>
        <span className="text-stone-400">▾</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Đóng"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
            <div className="border-b p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên, đơn vị..."
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <ul className="max-h-44 overflow-y-auto text-sm">
              {filtered.length === 0 && (
                <li className="px-3 py-4 text-center text-stone-400">Không tìm thấy</li>
              )}
              {filtered.map((ing) => (
                <li key={ing.id}>
                  <button
                    type="button"
                    className={`flex w-full flex-col px-3 py-2 text-left hover:bg-blue-50 ${
                      ing.id === value ? 'bg-blue-50 font-semibold text-[#2F80ED]' : ''
                    }`}
                    onClick={() => {
                      onChange(ing.id);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <span>{ing.name}</span>
                    <span className="text-xs text-stone-500">
                      {INGREDIENT_CATEGORY_LABELS[ing.category]} · {ing.unit}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => {
                  onAddNew(query.trim());
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full border-t bg-emerald-50 px-3 py-2.5 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                + Thêm mới &quot;{query.trim()}&quot;
              </button>
            )}
          </div>
        </>
      )}

      {lastUnitPrice != null && lastUnitPrice > 0 && selected && (
        <p className="mt-0.5 text-[10px] text-stone-400">
          Giá nhập gần nhất: {lastUnitPrice.toLocaleString('vi-VN')} đ/{selected.unit}
        </p>
      )}
    </div>
  );
}
