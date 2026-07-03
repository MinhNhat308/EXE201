'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { BranchesController } from '@/controllers/branches.controller';
import type { Branch, BranchSummary } from '@/models/branch.model';
import { AdminLayout } from './AdminLayout';

export function BranchesAdminView() {
  const [rows, setRows] = useState<Branch[]>([]);
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', name: '', address: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        BranchesController.list(),
        BranchesController.summary(),
      ]);
      setRows(list);
      setSummary(sum);
      setError('');
    } catch {
      setError('Không tải được danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await BranchesController.create({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        address: form.address.trim() || undefined,
      });
      setForm({ code: '', name: '', address: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo chi nhánh thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-stone-900">Quản lý chi nhánh</h1>
        <p className="mt-1 text-sm text-stone-500">
          Chuỗi BOBAPOS — mỗi chi nhánh có kho & đơn riêng. Dùng bộ chọn chi nhánh ở sidebar để
          xem báo cáo / tồn theo CN.
        </p>

        {summary && (
          <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Đang dùng <strong>{summary.count}</strong> / {summary.maxBranches} chi nhánh
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-4"
        >
          <input
            required
            placeholder="Mã CN (VD: CN-PN)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Tên chi nhánh"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            + Thêm CN
          </button>
        </form>

        {loading ? (
          <p className="mt-8 text-stone-500">Đang tải…</p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã</th>
                  <th className="px-4 py-3 font-medium">Tên</th>
                  <th className="px-4 py-3 font-medium">Địa chỉ</th>
                  <th className="px-4 py-3 font-medium">Mặc định</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-mono font-semibold">{b.code}</td>
                    <td className="px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3 text-stone-600">{b.address ?? '—'}</td>
                    <td className="px-4 py-3">
                      {b.isDefault ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Trụ sở
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
