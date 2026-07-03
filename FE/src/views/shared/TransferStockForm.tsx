'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InventoryController } from '@/controllers/inventory.controller';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { Ingredient, WarehouseLocation } from '@/models/inventory.model';

export function TransferStockForm() {
  const { warehouses, version } = useBranchWarehouses();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([{ ingredientId: '', quantity: 0 }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    InventoryController.getIngredients().then((ings) => {
      setIngredients(ings);
      const kho2 = warehouses.find((w) => w.code.endsWith('_KHO2') || w.code === 'KHO2');
      const kho1 = warehouses.find((w) => w.isKitchenSource);
      if (kho2) setFromId(kho2.id);
      if (kho1) setToId(kho1.id);
    });
  }, [warehouses, version]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const valid = lines.filter((l) => l.ingredientId && l.quantity > 0);
    if (!fromId || !toId || !valid.length) {
      setError('Chọn kho và ít nhất một dòng chuyển');
      return;
    }
    setSaving(true);
    try {
      await InventoryController.transferStock({
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        note: note || undefined,
        lines: valid,
      });
      setSuccess('Đã chuyển kho thành công');
      setLines([{ ingredientId: '', quantity: 0 }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chuyển kho thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-xl border bg-white p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium">Từ kho</span>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium">Đến kho</span>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú chuyển kho"
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      {lines.map((line, idx) => (
        <div key={idx} className="flex gap-2">
          <select
            value={line.ingredientId}
            onChange={(e) => {
              const next = [...lines];
              next[idx] = { ...next[idx], ingredientId: e.target.value };
              setLines(next);
            }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">— Nguyên liệu —</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name}
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
              next[idx] = { ...next[idx], quantity: parseFloat(e.target.value) || 0 };
              setLines(next);
            }}
            className="w-28 rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setLines([...lines, { ingredientId: '', quantity: 0 }])}
        className="text-sm text-stone-600 hover:underline"
      >
        + Thêm dòng
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? 'Đang chuyển...' : 'Xác nhận chuyển kho'}
      </button>
    </form>
  );
}
