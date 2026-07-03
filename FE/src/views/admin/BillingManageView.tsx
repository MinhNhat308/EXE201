'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BillingController, BankTransferInfo } from '@/controllers/billing.controller';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { BRAND } from '@/lib/brand';
import { SEGMENTS, segmentLabel } from '@/lib/segments';
import {
  BillingInvoice,
  SubscriptionPlan,
  SubscriptionStatus,
  TenantInfo,
} from '@/models/tenant.model';
import { AdminLayout } from './AdminLayout';

const PLAN_PRICE: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.SOLO]: 99_000,
  [SubscriptionPlan.STANDARD]: 299_000,
  [SubscriptionPlan.PREMIUM]: 599_000,
};

export function BillingManageView() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan>(SubscriptionPlan.STANDARD);
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastInvoiceId, setLastInvoiceId] = useState<string | null>(null);
  const [momoEnabled, setMomoEnabled] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankTransferInfo | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [invData, subData, momo, bank] = await Promise.all([
        BillingController.listInvoices(),
        SubscriptionController.get(),
        BillingController.momoConfig().catch(() => ({ enabled: false, redirectUrl: '' })),
        BillingController.transferInfo().catch(() => null),
      ]);
      setInvoices(invData);
      setTenant(subData.tenant);
      setStatus(subData.subscription.status);
      setTrialDaysLeft(subData.trialDaysLeft);
      setMomoEnabled(momo.enabled);
      setBankInfo(bank);
      const intended = subData.tenant.intendedPlan ?? subData.subscription.plan;
      setCheckoutPlan(intended);
    } catch {
      setMessage('Không tải được thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const estimated = PLAN_PRICE[checkoutPlan] * months;

  const handleCheckout = async () => {
    setBusy(true);
    setMessage('');
    setLastInvoiceId(null);
    try {
      const inv = await BillingController.checkout(checkoutPlan, months);
      setLastInvoiceId(inv.id);
      setMessage(
        `Đã tạo hóa đơn. Chuyển khoản ${inv.amount.toLocaleString('vi-VN')}đ theo thông tin bên dưới.`,
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Tạo hóa đơn thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleMomoPay = async () => {
    setBusy(true);
    setMessage('');
    setLastInvoiceId(null);
    try {
      const res = await BillingController.checkoutMomo(checkoutPlan, months);
      sessionStorage.setItem('bobapos_pending_invoice', res.invoice.id);
      const redirect = new URL(res.payUrl);
      window.location.href = redirect.toString();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không mở được MoMo');
      setBusy(false);
    }
  };

  const handleConfirmPaid = async (id: string) => {
    setBusy(true);
    setMessage('');
    try {
      await BillingController.confirmPaid(id);
      setMessage('Đã xác nhận thanh toán — gói BOBAPOS được kích hoạt. Bạn có thể vận hành bình thường.');
      setLastInvoiceId(null);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Xác nhận thất bại');
    } finally {
      setBusy(false);
    }
  };

  const pendingInvoice = lastInvoiceId
    ? invoices.find((i) => i.id === lastInvoiceId)
    : invoices.find((i) => i.status === 'PENDING');

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold">Thanh toán & gia hạn gói</h1>
      <p className="mt-1 text-stone-500">
        Trial 7 ngày miễn phí → sau đó thanh toán tại đây để tiếp tục dùng BOBAPOS
      </p>

      {/* Trạng thái hiện tại */}
      {!loading && (
        <div
          className={`mt-6 rounded-2xl border p-5 ${
            status === SubscriptionStatus.TRIAL
              ? 'border-sky-200 bg-gradient-to-r from-sky-50 to-violet-50'
              : status === SubscriptionStatus.EXPIRED
                ? 'border-amber-200 bg-amber-50'
                : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          {status === SubscriptionStatus.TRIAL && (
            <>
              <p className="font-bold text-stone-900">
                Đang dùng thử Premium — còn{' '}
                <span className="text-[#2F80ED]">{trialDaysLeft} ngày</span>
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Bạn đang trải nghiệm <strong>đủ tính năng Premium</strong>. Hết trial cần thanh
                toán gói{' '}
                <strong>{segmentLabel(tenant?.intendedPlan ?? checkoutPlan)}</strong> để tiếp tục
                tạo đơn, phiếu kho và chỉnh sửa dữ liệu.
              </p>
            </>
          )}
          {status === SubscriptionStatus.ACTIVE && (
            <>
              <p className="font-bold text-emerald-800">Gói đang hoạt động</p>
              <p className="mt-1 text-sm text-stone-600">
                Có thể tạo hóa đơn gia hạn thêm tháng bất cứ lúc nào.
              </p>
            </>
          )}
          {status === SubscriptionStatus.EXPIRED && (
            <>
              <p className="font-bold text-amber-900">Trial / gói đã hết hạn</p>
              <p className="mt-1 text-sm text-amber-900/90">
                Bạn vẫn xem được dữ liệu nhưng không thể thao tác mới. Tạo hóa đơn và thanh toán
                bên dưới để kích hoạt lại.
              </p>
            </>
          )}
        </div>
      )}

      {/* Luồng 3 bước */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { n: '1', t: 'Chọn gói & thời hạn', d: 'Gói bạn đã chọn khi đăng ký (Solo / Store / Chain).' },
          {
            n: '2',
            t: 'Tạo hóa đơn & quét QR',
            d: 'Quét mã QR ngân hàng hoặc chuyển khoản thủ công theo nội dung hóa đơn.',
          },
          {
            n: '3',
            t: 'Xác nhận & dùng tiếp',
            d: 'Sau khi nhận tiền, bấm xác nhận để kích hoạt gói (demo: tự xác nhận).',
          },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border bg-white p-4 shadow-sm">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white ${BRAND.primary}`}>
              {s.n}
            </span>
            <p className="mt-3 font-semibold text-stone-900">{s.t}</p>
            <p className="mt-1 text-xs text-stone-500">{s.d}</p>
          </div>
        ))}
      </div>

      {/* Tạo hóa đơn */}
      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-bold text-stone-900">Tạo hóa đơn gia hạn</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Gói BOBAPOS</label>
            <select
              value={checkoutPlan}
              onChange={(e) => setCheckoutPlan(e.target.value as SubscriptionPlan)}
              className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              {SEGMENTS.map((seg) => (
                <option key={seg.plan} value={seg.plan}>
                  {seg.name} — {seg.priceLabel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Thời hạn</label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              {[1, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} tháng
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl bg-stone-50 px-4 py-2.5">
            <p className="text-xs text-stone-500">Tạm tính</p>
            <p className="text-lg font-bold text-stone-900">
              {estimated.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleCheckout}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md ${BRAND.primary}`}
          >
            {busy ? 'Đang tạo...' : 'Tạo hóa đơn & hiện QR'}
          </button>
          {momoEnabled && (
            <button
              type="button"
              disabled={busy}
              onClick={handleMomoPay}
              className="rounded-xl bg-[#A50064] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-200/50 transition hover:bg-[#8e0056] disabled:opacity-60"
            >
              {busy ? 'Đang mở MoMo...' : 'Hoặc: MoMo'}
            </button>
          )}
        </div>
        {bankInfo && (
          <p className="mt-4 text-xs text-stone-500">
            TK nhận tiền: <strong>{bankInfo.bank}</strong> · {bankInfo.account} · {bankInfo.holder}
            — cấu hình trong <code className="rounded bg-stone-100 px-1">BE/.env</code> (
            SAAS_BANK_*). Ảnh QR: đặt file vào <code className="rounded bg-stone-100 px-1">FE/public{bankInfo.qrUrl}</code>
          </p>
        )}
      </div>

      {/* Hướng dẫn CK — chỉ hóa đơn thủ công */}
      {pendingInvoice && pendingInvoice.paymentMethod !== 'MOMO' && bankInfo && (
        <div className="mt-6 rounded-2xl border-2 border-[#2F80ED]/30 bg-sky-50/50 p-6">
          <h2 className="font-bold text-stone-900">Chuyển khoản thanh toán</h2>
          <p className="mt-1 text-sm text-stone-600">
            Hóa đơn <strong>{pendingInvoice.id.slice(-8).toUpperCase()}</strong> ·{' '}
            <strong>{pendingInvoice.amount.toLocaleString('vi-VN')}đ</strong> · Gói{' '}
            {segmentLabel(pendingInvoice.plan)}
          </p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-2xl border bg-white p-3 shadow-sm">
              <p className="mb-2 text-center text-xs font-semibold text-stone-500">Quét mã QR</p>
              <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-xl bg-stone-100">
                <Image
                  src={bankInfo.qrUrl}
                  alt="QR chuyển khoản"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <dl className="grid flex-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-white p-3">
              <dt className="text-xs text-stone-500">Ngân hàng</dt>
              <dd className="font-semibold">{bankInfo.bank}</dd>
            </div>
            <div className="rounded-xl bg-white p-3">
              <dt className="text-xs text-stone-500">Số tài khoản</dt>
              <dd className="font-semibold">{bankInfo.account}</dd>
            </div>
            <div className="rounded-xl bg-white p-3 sm:col-span-2">
              <dt className="text-xs text-stone-500">Chủ tài khoản</dt>
              <dd className="font-semibold">{bankInfo.holder}</dd>
            </div>
            <div className="rounded-xl bg-white p-3 sm:col-span-2">
              <dt className="text-xs text-stone-500">Số tiền chuyển</dt>
              <dd className="text-lg font-bold text-[#2F80ED]">
                {pendingInvoice.amount.toLocaleString('vi-VN')}đ
              </dd>
            </div>
            <div className="rounded-xl bg-white p-3 sm:col-span-2">
              <dt className="text-xs text-stone-500">Nội dung chuyển khoản</dt>
              <dd className="font-mono text-sm">
                {bankInfo.transferPrefix} {pendingInvoice.id.slice(-8).toUpperCase()}
              </dd>
            </div>
            </dl>
          </div>
          {bankInfo.note && (
            <p className="mt-3 text-xs text-stone-500">{bankInfo.note}</p>
          )}
          <p className="mt-4 text-xs text-stone-500">
            Sau khi chuyển khoản, bấm <strong>Xác nhận đã thanh toán</strong> để kích hoạt gói.
            Production: admin SaaS xác nhận khi thấy tiền vào tài khoản.
          </p>
          {pendingInvoice.status === 'PENDING' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleConfirmPaid(pendingInvoice.id)}
              className={`mt-4 rounded-xl px-5 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
            >
              Xác nhận đã thanh toán (demo)
            </button>
          )}
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          {message}
        </p>
      )}

      <div className="mt-8">
        <h2 className="font-bold text-stone-900">Lịch sử hóa đơn</h2>
        {loading ? (
          <p className="mt-4 text-stone-500">Đang tải...</p>
        ) : invoices.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Chưa có hóa đơn — tạo hóa đơn đầu tiên ở trên.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-stone-50 text-left">
                <tr>
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Gói</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">
                      {inv.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium">{segmentLabel(inv.plan)}</td>
                    <td className="px-4 py-3">
                      {inv.amount.toLocaleString('vi-VN')} {inv.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {inv.createdAt
                        ? new Date(inv.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleConfirmPaid(inv.id)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold text-white ${BRAND.primary}`}
                        >
                          Xác nhận đã TT
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-stone-500">
        <Link href="/dashboard/admin/subscription" className={BRAND.primaryText}>
          ← Quản lý gói đăng ký
        </Link>
      </p>
    </AdminLayout>
  );
}
