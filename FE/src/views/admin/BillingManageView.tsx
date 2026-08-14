'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BillingController, BankTransferInfo } from '@/controllers/billing.controller';
import { usePolling } from '@/lib/use-polling';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { getStoredUser, getToken, saveAuth } from '@/lib/auth-storage';
import { BRAND } from '@/lib/brand';
import { SEGMENTS, segmentLabel } from '@/lib/segments';
import { SOLO_HUB_PATH } from '@/lib/workspace-routes';
import {
  BillingInvoice,
  SubscriptionPlan,
  SubscriptionStatus,
  TenantInfo,
} from '@/models/tenant.model';
import { SoloShellLayout } from '@/views/solo/SoloShellLayout';
import { AdminLayout } from './AdminLayout';

const PLAN_PRICE: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.SOLO]: 99_000,
  [SubscriptionPlan.STANDARD]: 299_000,
  [SubscriptionPlan.PREMIUM]: 599_000,
};

const SUBSCRIPTION_PERIOD_DAYS = 30;
const PAYMENT_TIMEOUT_MINUTES = 10;

function getInvoiceExpiresAt(inv: BillingInvoice): Date {
  if (inv.expiresAt) return new Date(inv.expiresAt);
  if (inv.createdAt) {
    return new Date(new Date(inv.createdAt).getTime() + PAYMENT_TIMEOUT_MINUTES * 60_000);
  }
  return new Date(0);
}

function isPendingActive(inv: BillingInvoice): boolean {
  return inv.status === 'PENDING' && getInvoiceExpiresAt(inv).getTime() > Date.now();
}

function invoiceStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return 'Đã thanh toán';
    case 'EXPIRED':
      return 'Hết hạn';
    case 'PENDING':
      return 'Chờ thanh toán';
    default:
      return status;
  }
}

export function BillingManageView({ variant = 'admin' }: { variant?: 'admin' | 'solo' }) {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan>(SubscriptionPlan.STANDARD);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastInvoiceId, setLastInvoiceId] = useState<string | null>(null);
  const [momoEnabled, setMomoEnabled] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankTransferInfo | null>(null);
  const [paySecondsLeft, setPaySecondsLeft] = useState(0);
  const paymentTimeoutMinutes = bankInfo?.paymentTimeoutMinutes ?? PAYMENT_TIMEOUT_MINUTES;

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
      setDaysLeft(subData.daysLeft);
      setMomoEnabled(momo.enabled);
      setBankInfo(bank);
      const intended = subData.tenant.intendedPlan ?? subData.subscription.plan;
      setCheckoutPlan(variant === 'solo' ? SubscriptionPlan.SOLO : intended);

      const token = getToken();
      const user = getStoredUser();
      if (token && user) {
        saveAuth(token, user, {
          tenant: subData.tenant,
          subscription: subData.subscription,
          trialDaysLeft: subData.trialDaysLeft,
          daysLeft: subData.daysLeft,
          plan: subData.subscription.plan,
          status: subData.subscription.status,
        });
      }
    } catch {
      setMessage('Không tải được thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const estimated = PLAN_PRICE[checkoutPlan];

  const handleCheckout = async () => {
    setBusy(true);
    setMessage('');
    setLastInvoiceId(null);
    try {
      const inv = await BillingController.checkout(checkoutPlan);
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
      const res = await BillingController.checkoutMomo(checkoutPlan);
      sessionStorage.setItem('bobapos_pending_invoice', res.invoice.id);
      const redirect = new URL(res.payUrl);
      window.location.href = redirect.toString();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không mở được MoMo');
      setBusy(false);
    }
  };

  const activePendingInvoice = invoices.find(isPendingActive);
  const pendingInvoice =
    lastInvoiceId && invoices.find((i) => i.id === lastInvoiceId && isPendingActive(i))
      ? invoices.find((i) => i.id === lastInvoiceId && isPendingActive(i))
      : activePendingInvoice;

  useEffect(() => {
    if (!pendingInvoice) {
      setPaySecondsLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((getInvoiceExpiresAt(pendingInvoice).getTime() - Date.now()) / 1000),
      );
      setPaySecondsLeft(left);
      if (left === 0) {
        void load();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [pendingInvoice?.id, pendingInvoice?.expiresAt, pendingInvoice?.createdAt]);

  usePolling(
    async () => {
      if (!pendingInvoice || !isPendingActive(pendingInvoice)) return;
      try {
        const fresh = await BillingController.getInvoice(pendingInvoice.id);
        if (fresh.status === 'PAID') {
          setMessage('SePay đã xác nhận thanh toán — gói được kích hoạt tự động.');
          setLastInvoiceId(null);
          await load();
        } else if (fresh.status === 'EXPIRED') {
          setMessage('Hóa đơn đã hết hạn. Bạn có thể tạo hóa đơn mới.');
          setLastInvoiceId(null);
          await load();
        }
      } catch {
        /* ignore */
      }
    },
    5000,
    Boolean(pendingInvoice && isPendingActive(pendingInvoice)),
  );

  const payMinutesLeft = Math.floor(paySecondsLeft / 60);
  const paySecondsRemainder = paySecondsLeft % 60;
  const hasActivePending = Boolean(activePendingInvoice);

  const body = (
    <>
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
              <p className="font-bold text-emerald-800">
                Gói đang hoạt động — còn{' '}
                <span className="text-emerald-700">{daysLeft} ngày</span>
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Có thể tạo hóa đơn gia hạn thêm {SUBSCRIPTION_PERIOD_DAYS} ngày bất cứ lúc nào.
                {daysLeft <= 7 && (
                  <>
                    {' '}
                    <strong className="text-amber-800">Gói sắp hết hạn — nên gia hạn sớm.</strong>
                  </>
                )}
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
          { n: '1', t: 'Chọn gói', d: 'Solo 99k · Store 299k · Chain 599k — mỗi gói dùng 30 ngày.' },
          {
            n: '2',
            t: 'Tạo hóa đơn & quét QR',
            d: `Mỗi lần chỉ 1 hóa đơn — thanh toán trong ${paymentTimeoutMinutes} phút.`,
          },
          {
            n: '3',
            t: 'SePay xác nhận',
            d: 'Chuyển khoản đúng số tiền + nội dung → gói ACTIVE tự động.',
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
        <p className="mt-1 text-xs text-stone-500">
          Quy tắc: tối đa <strong>1 hóa đơn chờ</strong> · thanh toán trong{' '}
          <strong>{paymentTimeoutMinutes} phút</strong> · hết hạn tự tạo mới.
        </p>
        {hasActivePending && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Bạn đang có hóa đơn chờ thanh toán
            {paySecondsLeft > 0 && (
              <>
                {' '}
                — còn{' '}
                <strong>
                  {payMinutesLeft}:{String(paySecondsRemainder).padStart(2, '0')}
                </strong>
              </>
            )}
            . Hoàn tất CK hoặc đợi hết hạn rồi tạo hóa đơn mới.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Gói BOBAPOS</label>
            <select
              value={checkoutPlan}
              onChange={(e) => setCheckoutPlan(e.target.value as SubscriptionPlan)}
              disabled={variant === 'solo'}
              className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm disabled:bg-stone-50 disabled:text-stone-600"
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
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-700">
              {SUBSCRIPTION_PERIOD_DAYS} ngày / lần thanh toán
            </div>
          </div>
          <div className="rounded-xl bg-stone-50 px-4 py-2.5">
            <p className="text-xs text-stone-500">Tạm tính (30 ngày)</p>
            <p className="text-lg font-bold text-stone-900">
              {estimated.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <button
            type="button"
            disabled={busy || hasActivePending}
            onClick={handleCheckout}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${BRAND.primary}`}
          >
            {busy ? 'Đang tạo...' : hasActivePending ? 'Đang có hóa đơn chờ' : 'Tạo hóa đơn & hiện QR'}
          </button>
          {momoEnabled && (
            <button
              type="button"
              disabled={busy || hasActivePending}
              onClick={handleMomoPay}
              className="rounded-xl bg-[#A50064] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-200/50 transition hover:bg-[#8e0056] disabled:cursor-not-allowed disabled:opacity-60"
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
            {paySecondsLeft > 0 && (
              <>
                {' '}
                · Còn{' '}
                <strong className="text-amber-700">
                  {payMinutesLeft}:{String(paySecondsRemainder).padStart(2, '0')}
                </strong>{' '}
                để thanh toán
              </>
            )}
          </p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-2xl border bg-white p-3 shadow-sm">
              <p className="mb-2 text-center text-xs font-semibold text-stone-500">Quét mã QR VietQR</p>
              <div className="relative mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
                {pendingInvoice.paymentQrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pendingInvoice.paymentQrUrl}
                    alt="QR thanh toán"
                    className="h-full w-full object-contain"
                  />
                ) : bankInfo ? (
                  <Image
                    src={bankInfo.qrUrl}
                    alt="QR chuyển khoản"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : null}
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
                {pendingInvoice.paymentCode ??
                  `${bankInfo.transferPrefix} ${pendingInvoice.id.slice(-8).toUpperCase()}`}
              </dd>
            </div>
            </dl>
          </div>
          <p className="mt-4 text-xs text-stone-500">
            SePay tự xác nhận khi tiền vào đúng số tiền và nội dung{' '}
            <strong>{pendingInvoice.paymentCode}</strong>. Không cần thao tác thủ công.
          </p>
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
                            : inv.status === 'EXPIRED'
                              ? 'bg-stone-200 text-stone-600'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {invoiceStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {inv.createdAt
                        ? new Date(inv.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {variant === 'admin' ? (
        <p className="mt-6 text-sm text-stone-500">
          <Link href="/dashboard/admin/subscription" className={BRAND.primaryText}>
            ← Quản lý gói đăng ký
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-sm text-stone-500">
          <Link href={SOLO_HUB_PATH} className={BRAND.primaryText}>
            ← Về trang chủ Solo
          </Link>
        </p>
      )}
    </>
  );

  if (variant === 'solo') {
    return (
      <SoloShellLayout title="Gói & gia hạn" backHref={SOLO_HUB_PATH}>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{body}</div>
      </SoloShellLayout>
    );
  }

  return <AdminLayout>{body}</AdminLayout>;
}
