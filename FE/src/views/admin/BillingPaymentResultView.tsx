'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { BillingController } from '@/controllers/billing.controller';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { saveAuth, getToken, getStoredUser } from '@/lib/auth-storage';
import { BRAND } from '@/lib/brand';
import { usePolling } from '@/lib/use-polling';
import { segmentLabel } from '@/lib/segments';
import { AdminLayout } from './AdminLayout';

function BillingPaymentResultInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId =
    searchParams.get('invoiceId') ||
    searchParams.get('orderId') ||
    searchParams.get('extraData');
  const momoResult = searchParams.get('resultCode');

  const [status, setStatus] = useState<'pending' | 'paid' | 'failed' | 'unknown'>('pending');
  const [invoice, setInvoice] = useState<{
    plan: string;
    amount: number;
    status: string;
  } | null>(null);
  const [message, setMessage] = useState('Đang xác nhận thanh toán với MoMo...');

  const refreshSubscription = useCallback(async () => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) return;
    try {
      const res = await SubscriptionController.get();
      saveAuth(token, user, {
        tenant: res.tenant,
        subscription: res.subscription,
        trialDaysLeft: res.trialDaysLeft,
        plan: res.subscription.plan,
        status: res.subscription.status,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const pollInvoice = useCallback(async () => {
    if (!invoiceId) return;
    try {
      const inv = await BillingController.getInvoice(invoiceId);
      setInvoice({ plan: inv.plan, amount: inv.amount, status: inv.status });
      if (inv.status === 'PAID') {
        setStatus('paid');
        setMessage('Thanh toán thành công! Gói BOBAPOS đã được kích hoạt.');
        await refreshSubscription();
      } else if (momoResult && momoResult !== '0') {
        setStatus('failed');
        setMessage('MoMo báo thanh toán chưa thành công. Bạn có thể thử lại tại trang Thanh toán.');
      }
    } catch {
      setStatus('unknown');
      setMessage('Không đọc được trạng thái hóa đơn.');
    }
  }, [invoiceId, momoResult, refreshSubscription]);

  useEffect(() => {
    if (!invoiceId) {
      setStatus('unknown');
      setMessage('Thiếu mã hóa đơn. Quay lại trang thanh toán.');
    }
  }, [invoiceId]);

  usePolling(pollInvoice, 2000, Boolean(invoiceId) && status === 'pending');

  return (
    <AdminLayout>
      <div className="mx-auto max-w-lg py-8 text-center">
        {status === 'pending' && (
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-pink-200 border-t-[#A50064]" />
        )}
        {status === 'paid' && (
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>
        )}
        {status === 'failed' && (
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
            !
          </div>
        )}

        <h1 className="text-2xl font-bold text-stone-900">
          {status === 'paid'
            ? 'Thanh toán MoMo thành công'
            : status === 'failed'
              ? 'Thanh toán chưa hoàn tất'
              : 'Đang xác nhận thanh toán'}
        </h1>
        <p className="mt-3 text-sm text-stone-600">{message}</p>

        {invoice && (
          <div className="mt-6 rounded-2xl border bg-white p-5 text-left text-sm shadow-sm">
            <p>
              Gói: <strong>{segmentLabel(invoice.plan as never)}</strong>
            </p>
            <p className="mt-1">
              Số tiền: <strong>{invoice.amount.toLocaleString('vi-VN')}đ</strong>
            </p>
            <p className="mt-1">
              Trạng thái:{' '}
              <strong className={invoice.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>
                {invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chờ xác nhận'}
              </strong>
            </p>
          </div>
        )}

        {status === 'pending' && (
          <p className="mt-4 text-xs text-stone-400">
            Cập nhật realtime qua webhook MoMo + kiểm tra mỗi 2 giây
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {status === 'paid' && (
            <button
              type="button"
              onClick={() => router.replace('/dashboard/admin')}
              className={`rounded-xl px-6 py-3 text-sm font-bold text-white ${BRAND.primary}`}
            >
              Vào quản trị →
            </button>
          )}
          <Link
            href="/dashboard/admin/billing"
            className="rounded-xl border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            ← Quay lại thanh toán
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

export function BillingPaymentResultView() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-[#A50064]" />
        </div>
      }
    >
      <BillingPaymentResultInner />
    </Suspense>
  );
}
