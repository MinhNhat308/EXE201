'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { Ingredient } from '@/models/inventory.model';
import {
  INGREDIENT_CATEGORY_LABELS,
  IngredientCategory,
} from '@/models/ingredient-category.model';
import { Modal } from '@/views/components/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (ingredient: Ingredient) => void;
  initialName?: string;
};

export function QuickAddIngredientModal({
  open,
  onClose,
  onCreated,
  initialName = '',
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: initialName,
    category: IngredientCategory.LIQUID,
    minStock: 0,
  });

  const unitHint = useMemo(() => {
    switch (form.category) {
      case IngredientCategory.LIQUID:
        return 'ml';
      case IngredientCategory.DRY:
      case IngredientCategory.TOPPING:
        return 'g';
      default:
        return 'đơn vị';
    }
  }, [form.category]);

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, name: initialName }));
      setError('');
    }
  }, [open, initialName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const name = form.name.trim();
    if (!name) {
      setError('Nhập tên nguyên liệu');
      return;
    }
    setSaving(true);
    try {
      const created = await InventoryController.createIngredient({
        name,
        category: form.category,
        minStock: form.minStock > 0 ? form.minStock : undefined,
      });
      onCreated(created);
      onClose();
      setForm({ name: '', category: IngredientCategory.LIQUID, minStock: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được nguyên liệu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-bold text-stone-900">Thêm nguyên liệu mới</h3>
        <p className="mt-1 text-sm text-stone-500">
          Tạo xong sẽ tự chọn vào dòng nhập NCC. Tồn ban đầu = 0 — nhập kho qua phiếu NCC.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="font-medium">Tên nguyên liệu *</span>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="VD: Syrup dâu tằm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Nhóm</span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as IngredientCategory })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {Object.values(IngredientCategory).map((c) => (
                <option key={c} value={c}>
                  {INGREDIENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-stone-500">
            Đơn vị kho mặc định: <strong>{unitHint}</strong>
          </p>
          <label className="block text-sm">
            <span className="font-medium">Tồn tối thiểu cảnh báo (tùy chọn)</span>
            <input
              type="number"
              min={0}
              value={form.minStock || ''}
              onChange={(e) =>
                setForm({ ...form, minStock: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-[#2F80ED] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Đang tạo...' : 'Tạo & chọn vào phiếu'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2.5 text-sm"
          >
            Hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}
