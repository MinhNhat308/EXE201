'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BRAND } from '@/lib/brand';
import { InventoryController } from '@/controllers/inventory.controller';
import { useBranchWarehouses } from '@/lib/use-branch-warehouses';
import { Ingredient, WarehouseLocation } from '@/models/inventory.model';
import {
  STOCK_REQUEST_TYPE_LABELS,
  StockRequestType,
  StockTransferRequest,
} from '@/models/stock-request.model';

interface LineRow {
  ingredientId: string;
  quantity: number;
  maxQty?: number;
}

export function StockRequestForm({
  type,
  onSuccess,
}: {
  type: StockRequestType;
  onSuccess?: () => void;
}) {
  const isReturn = type === StockRequestType.RETURN_TO_CENTRAL;
  const isReplenish = type === StockRequestType.REPLENISH_FROM_CENTRAL;
  const { warehouses: branchWarehouses, version } = useBranchWarehouses();
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [openDispatch, setOpenDispatch] = useState<StockTransferRequest[]>([]);
  const [targetId, setTargetId] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    permitDocumentNumber: '',
    permitDocumentDate: new Date().toISOString().slice(0, 10),
    purpose: '',
    note: '',
    lines: [{ ingredientId: '', quantity: 0 }] as LineRow[],
  });

  useEffect(() => {
    const sub = branchWarehouses.filter((w) => !w.isCentralWarehouse);
    setWarehouses(sub);
    InventoryController.getIngredients().then((ings) => {
      setIngredients(ings);
      const kho1 = sub.find((w) => w.isKitchenSource) ?? sub[0];
      if (kho1) setTargetId(kho1.id);
    });
  }, [branchWarehouses, version]);

  useEffect(() => {
    if (!isReturn || !targetId) {
      setOpenDispatch([]);
      return;
    }
    InventoryController.getOpenDispatchForReturn(
      targetId,
      form.permitDocumentDate.slice(0, 10),
    ).then(setOpenDispatch);
  }, [isReturn, targetId, form.permitDocumentDate]);

  useEffect(() => {
    if (!isReturn || !parentId) return;
    const parent = openDispatch.find((p) => p.id === parentId);
    if (!parent) return;
    setForm((f) => ({
      ...f,
      permitDocumentDate:
        parent.businessDate?.slice(0, 10) ?? parent.permitDocumentDate?.slice(0, 10) ?? f.permitDocumentDate,
      lines: parent.lines
        .filter((l) => (l.remainingQuantity ?? 0) > 0)
        .map((l) => ({
          ingredientId: l.ingredientId,
          quantity: 0,
          maxQty: l.remainingQuantity ?? l.quantity,
        })),
    }));
  }, [parentId, openDispatch, isReturn]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const lines = form.lines.filter((l) => l.ingredientId && l.quantity > 0);
    if (!targetId || !form.permitDocumentNumber.trim() || !lines.length) {
      setError('Chọn kho, số chứng từ và ít nhất một dòng hàng');
      return;
    }
    if (isReturn && !parentId) {
      setError('Hoàn trả phải chọn phiếu cấp phát trong ngày');
      return;
    }

    setSaving(true);
    try {
      await InventoryController.createStockRequest({
        type,
        targetWarehouseId: targetId,
        parentRequestId: isReturn ? parentId : undefined,
        permitDocumentNumber: form.permitDocumentNumber.trim(),
        permitDocumentDate: form.permitDocumentDate,
        businessDate: form.permitDocumentDate.slice(0, 10),
        purpose: form.purpose.trim() || undefined,
        note: form.note.trim() || undefined,
        lines,
      });
      setSuccess('Đã gửi phiếu — chờ kế toán duyệt');
      setParentId('');
      setForm({
        permitDocumentNumber: '',
        permitDocumentDate: new Date().toISOString().slice(0, 10),
        purpose: '',
        note: '',
        lines: [{ ingredientId: '', quantity: 0 }],
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi phiếu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 rounded-2xl border bg-white p-6 shadow-sm ${BRAND.primarySoft}`}
    >
      <p className={`text-sm font-semibold ${BRAND.primaryText}`}>
        {STOCK_REQUEST_TYPE_LABELS[type]}
      </p>
      <p className="text-xs text-stone-500">
        {isReturn
          ? 'Tuỳ chọn: thu hồi phần còn lại về KHO_TONG — không bắt buộc cuối ca.'
          : isReplenish
            ? 'Bổ sung tồn kho lẻ — phần dư bàn giao ca sau.'
            : 'Đầu ca: cấp phát từ kho tổng — phần chưa dùng giữ tại kho con cho ca sau.'}
      </p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <label className="block text-sm">
        <span className="font-medium">Kho con</span>
        <select
          value={targetId}
          onChange={(e) => {
            setTargetId(e.target.value);
            setParentId('');
          }}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.code} — {w.name}
            </option>
          ))}
        </select>
      </label>

      {isReturn && (
        <label className="block text-sm">
          <span className="font-medium">Phiếu cấp phát gốc *</span>
          <select
            required
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="">— Chọn PXK cấp phát —</option>
            {openDispatch.map((p) => (
              <option key={p.id} value={p.id}>
                {p.requestNumber} · CT {p.permitDocumentNumber}
              </option>
            ))}
          </select>
          {!openDispatch.length && (
            <p className="mt-1 text-xs text-amber-700">
              Không có phiếu cấp phát đang mở trong ngày này
            </p>
          )}
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium">Số chứng từ xin phép *</span>
          <input
            required
            value={form.permitDocumentNumber}
            onChange={(e) =>
              setForm({ ...form, permitDocumentNumber: e.target.value })
            }
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder={
              isReturn ? 'HT-2026-001' : isReplenish ? 'BT-2026-001' : 'CP-2026-001'
            }
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Ngày nghiệp vụ *</span>
          <input
            type="date"
            required
            value={form.permitDocumentDate}
            onChange={(e) =>
              setForm({ ...form, permitDocumentDate: e.target.value })
            }
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
      </div>

      <input
        value={form.purpose}
        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
        placeholder="Mục đích"
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />

      {form.lines.map((line, idx) => (
        <div key={idx} className="flex flex-wrap items-center gap-2">
          <select
            value={line.ingredientId}
            disabled={isReturn && !!parentId}
            onChange={(e) => {
              const next = [...form.lines];
              next[idx] = { ...next[idx], ingredientId: e.target.value };
              setForm({ ...form, lines: next });
            }}
            className="min-w-[160px] flex-1 rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">— Nguyên liệu —</option>
            {(isReturn && parentId
              ? form.lines.map((l) => ({
                  id: l.ingredientId,
                  name:
                    ingredients.find((x) => x.id === l.ingredientId)?.name ??
                    l.ingredientId,
                  max: l.maxQty,
                }))
              : ingredients.map((ing) => ({
                  id: ing.id,
                  name: ing.name,
                  max: undefined as number | undefined,
                }))
            ).map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
                {row.max != null ? ` (còn ${row.max})` : ''}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={line.maxQty}
            step="any"
            value={line.quantity || ''}
            onChange={(e) => {
              const next = [...form.lines];
              next[idx] = { ...next[idx], quantity: parseFloat(e.target.value) || 0 };
              setForm({ ...form, lines: next });
            }}
            className="w-28 rounded-lg border px-3 py-2 text-sm"
          />
          {line.maxQty != null && (
            <span className="text-xs text-stone-500">tối đa {line.maxQty}</span>
          )}
        </div>
      ))}

      {!isReturn && (
        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              lines: [...form.lines, { ingredientId: '', quantity: 0 }],
            })
          }
          className="text-sm text-blue-700 hover:underline"
        >
          + Thêm dòng
        </button>
      )}

      <button
        type="submit"
        disabled={saving}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${BRAND.primary}`}
      >
        {saving ? 'Đang gửi...' : 'Gửi phiếu chờ kế toán duyệt'}
      </button>
    </form>
  );
}
