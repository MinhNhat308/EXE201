'use client';

import { OrderLineItem } from '@/models/order.model';
import { formatToppingsLabel } from '@/lib/cart';
import { formatSugarIceLine } from '@/lib/sugar-ice';
import { WORK_SHIFT_LABELS, WorkShift } from '@/models/staff.model';
import { formatCurrency, formatDateTime } from '@/lib/format';

interface InvoicePreviewProps {
  storeName?: string;
  invoiceNumber?: string;
  orderNumber?: string;
  items: OrderLineItem[];
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  note?: string;
  paymentMethod?: string;
  paymentMethodLabel?: string;
  paymentQrImageUrl?: string;
  paymentBankInfo?: string;
  workShift?: WorkShift;
  staffName?: string;
  subtotal: number;
  total: number;
  createdAt?: string;
  printable?: boolean;
}

export function InvoicePreview({
  storeName,
  invoiceNumber,
  orderNumber,
  items,
  customerName,
  customerPhone,
  tableNumber,
  note,
  paymentMethod,
  paymentMethodLabel,
  paymentQrImageUrl,
  paymentBankInfo,
  workShift,
  staffName,
  subtotal,
  total,
  createdAt,
  printable = false,
}: InvoicePreviewProps) {
  return (
    <div
      id={printable ? 'invoice-print' : undefined}
      className={`rounded-xl border border-stone-200 bg-white p-6 ${printable ? 'print-invoice' : ''}`}
    >
      <div className="border-b border-dashed border-stone-300 pb-4 text-center">
        <p className="text-xl font-bold text-stone-800">
          {storeName ? `🧋 ${storeName}` : '🧋 Bubble Tea Shop'}
        </p>
        <p className="text-sm text-stone-500">Hóa đơn bán hàng</p>
        {invoiceNumber && (
          <p className="mt-2 font-mono text-sm font-semibold text-amber-700">
            {invoiceNumber}
          </p>
        )}
        {orderNumber && (
          <p className="font-mono text-xs text-stone-400">Đơn #{orderNumber}</p>
        )}
      </div>

      <div className="space-y-1 border-b border-dashed border-stone-300 py-4 text-sm">
        {createdAt && <p>Ngày: {formatDateTime(createdAt)}</p>}
        {staffName && <p>Thu ngân: {staffName}</p>}
        {workShift && <p>Ca: {WORK_SHIFT_LABELS[workShift]}</p>}
        {customerName && <p>Khách: {customerName}</p>}
        {customerPhone && <p>SĐT: {customerPhone}</p>}
        {tableNumber && <p>Bàn/Số order: {tableNumber}</p>}
        {note && <p>Ghi chú: {note}</p>}
        {paymentMethod && (
          <p>Thanh toán: {paymentMethodLabel ?? paymentMethod}</p>
        )}
        {paymentMethod === 'BANK_TRANSFER' && paymentQrImageUrl && (
          <div className="mt-3 text-center print:block">
            <p className="text-xs text-stone-500">Quét QR chuyển khoản</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentQrImageUrl}
              alt="QR"
              className="mx-auto mt-1 max-h-36 object-contain print:max-h-40"
            />
            {paymentBankInfo && (
              <p className="mt-1 text-xs text-stone-600">{paymentBankInfo}</p>
            )}
          </div>
        )}
      </div>

      <div className="py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-stone-500">
              <th className="pb-2">Món</th>
              <th className="pb-2 text-center">SL</th>
              <th className="pb-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-stone-100">
                <td className="py-2">
                  {item.name}
                  {item.toppings?.length > 0 && (
                    <span className="block text-xs text-violet-600">
                      + {formatToppingsLabel(item.toppings)}
                    </span>
                  )}
                  {item.sugarPercent != null &&
                    (item.sugarPercent !== 100 || (item.icePercent ?? 100) !== 100) && (
                    <span className="block text-xs text-sky-600">
                      {formatSugarIceLine(item.sugarPercent, item.icePercent)}
                    </span>
                  )}
                  {item.note && (
                    <span className="block text-xs text-stone-400">{item.note}</span>
                  )}
                </td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 border-t border-dashed border-stone-300 pt-4 text-sm">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-amber-700">
          <span>Tổng cộng</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-stone-400">
        Cảm ơn quý khách! Hẹn gặp lại!
      </p>
    </div>
  );
}
