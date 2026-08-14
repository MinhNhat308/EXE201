'use client';

import { useEffect, useState } from 'react';
import { PaymentController, PaymentTransaction } from '@/controllers/payment.controller';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { AdminLayout } from '@/views/admin/AdminLayout';

const MATCH_LABELS: Record<string, string> = {
  MATCHED: 'Đã khớp',
  UNMATCHED: 'Chưa khớp',
  DUPLICATE: 'Trùng lặp',
  AMOUNT_MISMATCH: 'Sai số tiền',
  RECEIVED: 'Đã nhận',
};

const MATCH_COLORS: Record<string, string> = {
  MATCHED: 'bg-emerald-100 text-emerald-800',
  UNMATCHED: 'bg-amber-100 text-amber-800',
  DUPLICATE: 'bg-stone-100 text-stone-600',
  AMOUNT_MISMATCH: 'bg-red-100 text-red-700',
  RECEIVED: 'bg-sky-100 text-sky-800',
};

export function PaymentLogsView() {
  const [items, setItems] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await PaymentController.listTransactions(100));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Log thanh toán SePay</h1>
        <p className="text-sm text-stone-500">
          Mọi giao dịch SePay gửi về webhook đều được lưu tại đây. Đơn CK khớp tự động khi nội dung
          chứa mã <strong>BOBAPOS…</strong>
        </p>

        {error && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">SePay ID</th>
                <th className="px-4 py-3">Ngân hàng</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3">Mã TT</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                    Chưa có giao dịch — cấu hình webhook SePay trỏ về{' '}
                    <code className="rounded bg-stone-100 px-1">/api/payments/sepay/webhook</code>
                  </td>
                </tr>
              ) : (
                items.map((tx) => (
                  <tr key={tx.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                      {tx.transactionDate
                        ? formatDateTime(tx.transactionDate)
                        : tx.createdAt
                          ? formatDateTime(tx.createdAt)
                          : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{tx.sepayId}</td>
                    <td className="px-4 py-3">{tx.gateway}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(tx.transferAmount)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3" title={tx.content}>
                      {tx.content}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{tx.paymentCode ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          MATCH_COLORS[tx.matchStatus] ?? 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {MATCH_LABELS[tx.matchStatus] ?? tx.matchStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          Tải lại
        </button>
      </div>
    </AdminLayout>
  );
}
