'use client';

import { formatCurrency } from '@/lib/format';
import { Order, PaymentStatus } from '@/models/order.model';
import { PaymentController } from '@/controllers/payment.controller';
import { OrderController } from '@/controllers/order.controller';
import { usePolling } from '@/lib/use-polling';

interface BankPaymentPanelProps {
  order: Order;
  onPaid?: (order: Order) => void;
  compact?: boolean;
}

export function BankPaymentPanel({ order, onPaid, compact = false }: BankPaymentPanelProps) {
  const isPending =
    order.paymentMethod === 'BANK_TRANSFER' &&
    order.paymentStatus === PaymentStatus.PENDING;

  usePolling(
    async () => {
      if (!isPending) return;
      try {
        const fresh = await OrderController.getById(order.id);
        if (fresh.paymentStatus === PaymentStatus.PAID) {
          onPaid?.(fresh);
        }
      } catch {
        /* ignore */
      }
    },
    4000,
    isPending,
  );

  if (order.paymentMethod !== 'BANK_TRANSFER') return null;

  const handleManualConfirm = async () => {
    await PaymentController.confirmOrderPaid(order.id);
    const fresh = await OrderController.getById(order.id);
    onPaid?.(fresh);
  };

  return (
    <div
      className={`rounded-xl border border-sky-200 bg-sky-50/80 text-left ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
        {isPending ? '⏳ Chờ chuyển khoản' : '✅ Đã thanh toán CK'}
      </p>

      {order.paymentQrUrl && (
        <div className="mt-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.paymentQrUrl}
            alt="QR VietQR"
            className={`mx-auto rounded-lg border border-white bg-white object-contain ${
              compact ? 'max-h-40' : 'max-h-52'
            }`}
          />
        </div>
      )}

      <div className="mt-3 space-y-1 text-sm">
        <p>
          Số tiền:{' '}
          <strong className="text-[#2F80ED]">{formatCurrency(order.total)}</strong>
        </p>
        {order.paymentCode && (
          <p>
            Nội dung CK:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
              {order.paymentCode}
            </code>
          </p>
        )}
        {order.paymentBankInfo && (
          <p className="text-xs text-stone-600">{order.paymentBankInfo}</p>
        )}
      </div>

      {isPending && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-sky-800">
            Khách quét QR và chuyển khoản — hệ thống tự xác nhận qua SePay (3–30 giây).
          </p>
          <button
            type="button"
            onClick={() => void handleManualConfirm()}
            className="w-full rounded-lg border border-sky-300 bg-white py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100"
          >
            Xác nhận thủ công (đã nhận tiền)
          </button>
        </div>
      )}
    </div>
  );
}
