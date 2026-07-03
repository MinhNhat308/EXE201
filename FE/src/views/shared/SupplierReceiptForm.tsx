'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useActiveBranch } from '@/lib/use-active-branch';
import { formatCurrency } from '@/lib/format';
import { localDateString } from '@/lib/local-date';
import { Ingredient, SupplierReceipt } from '@/models/inventory.model';
import { IngredientPicker } from '@/views/shared/IngredientPicker';
import { QuickAddIngredientModal } from '@/views/shared/QuickAddIngredientModal';

export { SupplierReceiptList } from '@/views/shared/SupplierReceiptList';

interface LineRow {
  ingredientId: string;
  quantity: number;
  unitPrice: number;
  expiryDate: string;
}

const emptyLine = (): LineRow => ({
  ingredientId: '',
  quantity: 0,
  unitPrice: 0,
  expiryDate: '',
});

function suggestExpiryDate(documentDate: string, shelfLifeDays?: number) {
  if (!shelfLifeDays || shelfLifeDays <= 0) return '';
  const d = new Date(documentDate);
  d.setDate(d.getDate() + shelfLifeDays);
  return d.toISOString().slice(0, 10);
}

function suggestDocumentNumber(date: string) {
  const d = date.replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `NCC-${d}-${seq}`;
}

interface SupplierReceiptFormProps {
  onSuccess?: () => void;
}

export function SupplierReceiptForm({ onSuccess }: SupplierReceiptFormProps) {
  const { branchId, version } = useActiveBranch();
  const today = localDateString();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<SupplierReceipt[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLineIdx, setQuickAddLineIdx] = useState(0);
  const [quickAddInitialName, setQuickAddInitialName] = useState('');

  const [form, setForm] = useState({
    supplierName: '',
    documentNumber: suggestDocumentNumber(today),
    documentDate: today,
    note: '',
    lines: [emptyLine()],
  });

  const reloadCatalog = useCallback(async () => {
    const [ings, recs] = await Promise.all([
      InventoryController.getIngredients(),
      InventoryController.getSupplierReceipts(branchId, true),
    ]);
    setIngredients(ings);
    setRecentReceipts(recs);
  }, [branchId, version]);

  useEffect(() => {
    void reloadCatalog();
  }, [reloadCatalog]);

  const supplierSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const r of recentReceipts) {
      if (r.supplierName?.trim()) set.add(r.supplierName.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [recentReceipts]);

  const lastPriceByIngredient = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recentReceipts) {
      for (const line of r.lines ?? []) {
        if (!line.ingredientId || !(line.unitPrice && line.unitPrice > 0)) continue;
        if (!map.has(line.ingredientId)) {
          map.set(line.ingredientId, line.unitPrice);
        }
      }
    }
    return map;
  }, [recentReceipts]);

  const lineTotals = form.lines.map((l) =>
    l.ingredientId && l.quantity > 0 ? l.quantity * (l.unitPrice || 0) : 0,
  );
  const grandTotal = lineTotals.reduce((s, v) => s + v, 0);

  const updateLine = (index: number, patch: Partial<LineRow>) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  };

  const removeLine = (index: number) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.length <= 1 ? [emptyLine()] : f.lines.filter((_, i) => i !== index),
    }));
  };

  const openQuickAdd = (lineIdx: number, name = '') => {
    setQuickAddLineIdx(lineIdx);
    setQuickAddInitialName(name);
    setQuickAddOpen(true);
  };

  const handleIngredientCreated = (ingredient: Ingredient) => {
    setIngredients((prev) => {
      if (prev.some((i) => i.id === ingredient.id)) return prev;
      return [...prev, ingredient].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    });
    updateLine(quickAddLineIdx, { ingredientId: ingredient.id });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const lines = form.lines.filter((l) => l.ingredientId && l.quantity > 0);
    if (!form.supplierName.trim() || !form.documentNumber.trim()) {
      setError('Nhập tên NCC và số chứng từ / hóa đơn');
      return;
    }
    if (!lines.length) {
      setError('Thêm ít nhất một dòng nguyên liệu hợp lệ');
      return;
    }

    setSaving(true);
    try {
      await InventoryController.createSupplierReceipt({
        supplierName: form.supplierName.trim(),
        documentNumber: form.documentNumber.trim(),
        documentDate: form.documentDate,
        note: form.note.trim() || undefined,
        lines: lines.map((l) => ({
          ingredientId: l.ingredientId,
          quantity: l.quantity,
          unitPrice: l.unitPrice > 0 ? l.unitPrice : undefined,
          expiryDate: l.expiryDate || undefined,
        })),
      });
      setSuccess(
        `Đã ghi nhận ${lines.length} dòng vào KHO_TONG${
          grandTotal > 0 ? ` · ${formatCurrency(grandTotal)}` : ''
        }`,
      );
      const nextDate = form.documentDate;
      setForm({
        supplierName: form.supplierName.trim(),
        documentNumber: suggestDocumentNumber(nextDate),
        documentDate: nextDate,
        note: '',
        lines: [emptyLine()],
      });
      await reloadCatalog();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/50"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-sm text-blue-900">
            <strong>KHO_TONG</strong> — Nhập hàng từ NCC. NL mới? Bấm{' '}
            <strong>+ Thêm NL mới</strong> hoặc tìm rồi chọn &quot;Thêm mới&quot; trong dropdown.
          </div>
          <Link
            href="/dashboard/admin/ingredients"
            className="shrink-0 text-xs font-semibold text-[#2F80ED] hover:underline"
          >
            Quản lý danh mục NL →
          </Link>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{success}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Nhà cung cấp *</span>
            <input
              required
              list="ncc-supplier-list"
              value={form.supplierName}
              onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Tên công ty / NCC"
            />
            <datalist id="ncc-supplier-list">
              {supplierSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Số hóa đơn / chứng từ *</span>
            <div className="mt-1 flex gap-2">
              <input
                required
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 font-mono text-sm"
              />
              <button
                type="button"
                title="Gợi ý số mới"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    documentNumber: suggestDocumentNumber(f.documentDate),
                  }))
                }
                className="shrink-0 rounded-lg border px-3 py-2 text-xs text-stone-600 hover:bg-stone-50"
              >
                ↻ Mã mới
              </button>
            </div>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Ngày chứng từ *</span>
            <input
              type="date"
              required
              value={form.documentDate}
              max={today}
              onChange={(e) => setForm({ ...form, documentDate: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Ghi chú kế toán</span>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Tùy chọn"
            />
          </label>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-stone-800">Chi tiết nhập kho tổng</p>
            <button
              type="button"
              onClick={() => openQuickAdd(form.lines.length, '')}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              + Thêm NL mới vào danh mục
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
                <tr>
                  <th className="w-10 px-2 py-2">#</th>
                  <th className="px-2 py-2">Nguyên liệu</th>
                  <th className="w-28 px-2 py-2 text-right">Số lượng</th>
                  <th className="w-32 px-2 py-2 text-right">Đơn giá</th>
                  <th className="w-36 px-2 py-2">Hạn dùng</th>
                  <th className="w-32 px-2 py-2 text-right">Thành tiền</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line, idx) => {
                  const ing = ingredients.find((i) => i.id === line.ingredientId);
                  return (
                    <tr key={idx} className="border-t border-stone-100">
                      <td className="px-2 py-2 text-center text-stone-400">{idx + 1}</td>
                      <td className="px-2 py-2">
                        <IngredientPicker
                          ingredients={ingredients}
                          value={line.ingredientId}
                          onChange={(id) => {
                            const selected = ingredients.find((i) => i.id === id);
                            const last = lastPriceByIngredient.get(id);
                            updateLine(idx, {
                              ingredientId: id,
                              unitPrice: last ?? line.unitPrice,
                              expiryDate: suggestExpiryDate(
                                form.documentDate,
                                selected?.shelfLifeDays,
                              ),
                            });
                          }}
                          onAddNew={(name) => openQuickAdd(idx, name)}
                          lastUnitPrice={
                            line.ingredientId
                              ? lastPriceByIngredient.get(line.ingredientId)
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.quantity || ''}
                            onChange={(e) =>
                              updateLine(idx, {
                                quantity: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24 rounded-lg border px-2 py-1.5 text-right"
                          />
                          {ing && (
                            <span className="text-xs text-stone-400">{ing.unit}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={line.unitPrice || ''}
                          onChange={(e) =>
                            updateLine(idx, {
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border px-2 py-1.5 text-right"
                          placeholder="VNĐ"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={line.expiryDate}
                          onChange={(e) =>
                            updateLine(idx, { expiryDate: e.target.value })
                          }
                          className="w-full rounded-lg border px-2 py-1.5 text-sm"
                          title={
                            ing?.shelfLifeDays
                              ? `Gợi ý: +${ing.shelfLifeDays} ngày từ ngày CT`
                              : 'Hạn dùng (tuỳ chọn)'
                          }
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-stone-800">
                        {lineTotals[idx] > 0 ? formatCurrency(lineTotals[idx]) : '—'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-stone-400 hover:text-red-600"
                          title="Xóa dòng"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-stone-200 bg-stone-50">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-right font-semibold">
                    Tổng giá trị nhập
                  </td>
                  <td className="px-3 py-2 text-right text-base font-bold text-[#2F80ED]">
                    {grandTotal > 0 ? formatCurrency(grandTotal) : '—'}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }))}
            className="mt-2 text-sm font-medium text-[#2F80ED] hover:underline"
          >
            + Thêm dòng hàng
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : 'Ghi nhận NCC vào kho tổng'}
        </button>
      </form>

      <QuickAddIngredientModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreated={handleIngredientCreated}
        initialName={quickAddInitialName}
      />
    </>
  );
}
