'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminMenuController } from '@/controllers/admin.controller';
import { InventoryController } from '@/controllers/inventory.controller';
import { Ingredient, Recipe } from '@/models/inventory.model';
import {
  INGREDIENT_CATEGORY_LABELS,
  IngredientCategory,
  RECIPE_UNIT_HINT,
} from '@/models/ingredient-category.model';
import { MenuItem } from '@/models/menu.model';
import { AdminLayout } from './AdminLayout';
import { Modal } from '@/views/components/Modal';

interface LineForm {
  ingredientId: string;
  quantity: number;
}

export function RecipeManageView() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [lines, setLines] = useState<LineForm[]>([{ ingredientId: '', quantity: 0 }]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, ings, rcps] = await Promise.all([
        AdminMenuController.getAll(),
        InventoryController.getIngredients(),
        InventoryController.getRecipes(),
      ]);
      setMenu(items);
      setIngredients(ings);
      setRecipes(rcps);
    } catch {
      setError('Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recipeFor = (menuItemId: string) =>
    recipes.find((r) => r.menuItemId === menuItemId);

  const openEdit = (item: MenuItem) => {
    const existing = recipeFor(item.id);
    setSelectedMenu(item);
    setLines(
      existing?.lines?.length
        ? existing.lines.map((l) => ({
            ingredientId: l.ingredientId,
            quantity: l.quantity,
          }))
        : [{ ingredientId: '', quantity: 0 }],
    );
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMenu) return;
    const valid = lines.filter((l) => l.ingredientId && l.quantity > 0);
    setError('');
    try {
      await InventoryController.upsertRecipe(selectedMenu.id, valid);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu công thức thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Công thức món</h1>
        <p className="mt-1 text-sm text-stone-500">
          Gán nguyên liệu cho từng món — khi bếp chuyển đơn sang &quot;Đã hoàn thành&quot;, hệ
          thống trừ kho theo công thức × số lượng món
        </p>
      </div>

      {error && !modalOpen && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-stone-500">Đang tải...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Món</th>
                <th className="px-4 py-3 font-medium">Công thức</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {menu.map((item) => {
                const r = recipeFor(item.id);
                return (
                  <tr key={item.id} className="border-b border-stone-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800">{item.name}</p>
                      <p className="text-xs text-stone-500">{item.category}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {r?.lines?.length ? (
                        <ul className="space-y-0.5 text-xs">
                          {r.lines.map((l, i) => (
                            <li key={i}>
                              {l.ingredientName ?? l.ingredientId}: {l.quantity}
                              {l.unit ? ` ${l.unit}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-amber-600">Chưa thiết lập</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg bg-[#2F80ED] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2569c7]"
                      >
                        Sửa công thức
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-lg">
        {selectedMenu && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-stone-900">Công thức món</h2>
            <p className="font-medium text-stone-800">{selectedMenu.name}</p>
            {error && modalOpen && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  value={line.ingredientId}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], ingredientId: e.target.value };
                    setLines(next);
                  }}
                  className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">— Nguyên liệu —</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} — {INGREDIENT_CATEGORY_LABELS[ing.category]} ({ing.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={line.quantity || ''}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = {
                      ...next[idx],
                      quantity: parseFloat(e.target.value) || 0,
                    };
                    setLines(next);
                  }}
                  className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="SL / ly"
                  title={
                    line.ingredientId
                      ? RECIPE_UNIT_HINT[
                          ingredients.find((i) => i.id === line.ingredientId)
                            ?.category ?? IngredientCategory.OTHER
                        ]
                      : ''
                  }
                />
                <button
                  type="button"
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                  className="text-stone-400 hover:text-stone-600"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines([...lines, { ingredientId: '', quantity: 0 }])}
              className="text-sm text-amber-700 hover:underline"
            >
              + Thêm nguyên liệu
            </button>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#2F80ED] px-4 py-2 hover:bg-[#2569c7] text-sm font-medium text-white hover:bg-[#2569c7]"
              >
                Lưu
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}
