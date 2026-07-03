'use client';

import { formatCurrency } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/models/order.model';
import type {
  StoreReportEInvoiceConfig,
  StoreReportSalesInvoice,
} from '@/models/store-report.model';
import { pmLabel } from '@/views/store/reports/report-definitions';

type Props = {
  invoice: StoreReportSalesInvoice;
  config: StoreReportEInvoiceConfig;
  onClose: () => void;
};

export function SalesInvoicePreview({ invoice, config, onClose }: Props) {
  const issued = new Date(invoice.issuedAt).toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:relative print:inset-auto print:bg-transparent print:p-0">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl print:max-h-none print:shadow-none">
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-4 print:bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Hóa đơn bán hàng
              </p>
              <h2 className="text-lg font-bold text-stone-900">{config.storeName}</h2>
              {config.taxCode && (
                <p className="text-xs text-stone-500">MST: {config.taxCode}</p>
              )}
              {config.address && (
                <p className="text-xs text-stone-500">{config.address}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-200 print:hidden"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-4">
            <div>
              <p className="text-xs text-stone-400">Mẫu số</p>
              <p className="font-medium">{config.invoiceTemplate ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Ký hiệu</p>
              <p className="font-medium">{config.invoiceSerial ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Số hóa đơn</p>
              <p className="font-mono font-bold text-[#2F80ED]">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Ngày lập</p>
              <p className="font-medium">{issued}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-stone-400">Người mua</p>
            <p className="mt-1 font-medium">{invoice.buyerName}</p>
            <p className="text-xs text-stone-500">
              Mã đơn: {invoice.orderNumber} · NV: {invoice.staffName}
            </p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-stone-400">
                <th className="py-2">Hàng hóa</th>
                <th className="py-2 text-right">SL</th>
                <th className="py-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-100">
                <td className="py-2">Đơn hàng POS ({invoice.itemCount} món)</td>
                <td className="py-2 text-right">1</td>
                <td className="py-2 text-right">{formatCurrency(invoice.subtotalBeforeTax)}</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Cộng tiền hàng</span>
              <span>{formatCurrency(invoice.subtotalBeforeTax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Thuế GTGT ({config.vatRate}%)</span>
              <span>{formatCurrency(invoice.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Tổng thanh toán</span>
              <span className="text-[#2F80ED]">{formatCurrency(invoice.total)}</span>
            </div>
            <p className="text-xs text-stone-500">
              HTTT: {pmLabel(invoice.paymentMethod)} ·{' '}
              {ORDER_STATUS_LABELS[invoice.status] ?? invoice.status}
              {invoice.cancelled && ' · ĐÃ HỦY'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-t px-6 py-4 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 rounded-xl bg-[#2F80ED] py-2.5 text-sm font-semibold text-white"
          >
            🖨️ In hóa đơn
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
