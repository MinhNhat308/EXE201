'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/models/order.model';
import type { StoreReportBundle, StoreReportSalesInvoice } from '@/models/store-report.model';
import {
  STOCK_REQUEST_STATUS_LABELS,
  STOCK_REQUEST_TYPE_LABELS,
  StockRequestStatus,
  StockRequestType,
} from '@/models/stock-request.model';
import { ReportDataTable } from '@/views/store/reports/ReportDataTable';
import { SalesInvoicePreview } from '@/views/store/reports/SalesInvoicePreview';
import { SupplierReceiptList, SupplierReceiptListItem } from '@/views/shared/SupplierReceiptList';
import { fmtDate, pmLabel } from '@/views/store/reports/report-definitions';

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-stone-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? 'text-[#2F80ED]' : 'text-stone-900'}`}>
        {value}
      </p>
    </div>
  );
}

export function SalesInvoicesPanel({ bundle }: { bundle: StoreReportBundle }) {
  const [preview, setPreview] = useState<StoreReportSalesInvoice | null>(null);
  const rows = bundle.salesInvoices.filter((i) => !i.cancelled);

  return (
    <>
      <p className="text-sm text-stone-500">
        Sổ hóa đơn bán hàng — định dạng tương thích báo cáo HĐĐT (Mẫu{' '}
        <strong>{bundle.eInvoiceConfig.invoiceTemplate ?? '—'}</strong>, KH{' '}
        <strong>{bundle.eInvoiceConfig.invoiceSerial ?? '—'}</strong>, MST{' '}
        <strong>{bundle.eInvoiceConfig.taxCode ?? '—'}</strong>)
      </p>
      <ReportDataTable
        rows={bundle.salesInvoices}
        rowKey={(r) => r.invoiceNumber}
        columns={[
          {
            key: 'inv',
            header: 'Số HĐ',
            render: (r) => (
              <button
                type="button"
                onClick={() => setPreview(r)}
                className="font-mono font-semibold text-[#2F80ED] hover:underline"
              >
                {r.invoiceNumber}
              </button>
            ),
          },
          { key: 'date', header: 'Ngày', render: (r) => fmtDate(r.issuedAt) },
          { key: 'buyer', header: 'Khách', render: (r) => r.buyerName },
          {
            key: 'before',
            header: 'Tiền hàng',
            align: 'right',
            render: (r) => formatCurrency(r.subtotalBeforeTax),
          },
          {
            key: 'vat',
            header: 'Thuế',
            align: 'right',
            render: (r) => formatCurrency(r.vatAmount),
          },
          {
            key: 'total',
            header: 'Tổng',
            align: 'right',
            render: (r) => formatCurrency(r.total),
          },
          { key: 'pm', header: 'HTTT', render: (r) => pmLabel(r.paymentMethod) },
          {
            key: 'st',
            header: 'TT',
            render: (r) =>
              r.cancelled ? (
                <span className="text-red-600">Hủy</span>
              ) : (
                ORDER_STATUS_LABELS[r.status] ?? r.status
              ),
          },
        ]}
      />
      <p className="text-xs text-stone-400">
        {rows.length} hóa đơn hợp lệ · Bấm số HĐ để xem & in
      </p>
      {preview && (
        <SalesInvoicePreview
          invoice={preview}
          config={bundle.eInvoiceConfig}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

export function InvoiceSummaryPanel({ bundle }: { bundle: StoreReportBundle }) {
  const s = bundle.invoiceSummary;
  const cfg = bundle.eInvoiceConfig;
  return (
    <>
      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 text-sm">
        <p className="font-semibold text-blue-900">{cfg.storeName}</p>
        <p className="text-blue-800/80">
          MST: {cfg.taxCode ?? '—'} · Thuế GTGT: {cfg.vatRate}% · Mẫu:{' '}
          {cfg.invoiceTemplate ?? '—'} · KH: {cfg.invoiceSerial ?? '—'}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="HĐ phát hành" value={String(s.issuedCount)} accent />
        <KpiCard label="Tiền hàng (chưa thuế)" value={formatCurrency(s.subtotalBeforeTax)} />
        <KpiCard label="Thuế GTGT" value={formatCurrency(s.vatAmount)} accent />
        <KpiCard label="Tổng thanh toán" value={formatCurrency(s.totalAmount)} accent />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Tiền mặt" value={formatCurrency(s.cashTotal)} />
        <KpiCard label="Chuyển khoản" value={formatCurrency(s.bankTotal)} />
        <KpiCard label="HĐ đã hủy" value={String(s.cancelledCount)} />
      </div>
    </>
  );
}

export function StockSnapshotPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.stockSnapshot}
      rowKey={(r) => `${r.warehouseCode}-${r.ingredientName}`}
      columns={[
        { key: 'wh', header: 'Kho', render: (r) => r.warehouseName },
        { key: 'name', header: 'Nguyên liệu', render: (r) => r.ingredientName },
        { key: 'cat', header: 'Nhóm', render: (r) => r.category },
        {
          key: 'stock',
          header: 'Tồn',
          align: 'right',
          render: (r) => `${r.displayStock} ${r.displayUnit}`,
        },
        {
          key: 'min',
          header: 'Tối thiểu',
          align: 'right',
          render: (r) => `${r.displayMinStock} ${r.displayUnit}`,
        },
        {
          key: 'low',
          header: 'TT',
          render: (r) =>
            r.isLow ? (
              <span className="font-semibold text-amber-700">⚠ Thấp</span>
            ) : (
              <span className="text-emerald-600">OK</span>
            ),
        },
      ]}
    />
  );
}

export function StockMovementsPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.stockMovements}
      rowKey={(r, i) => `${r.time}-${i}`}
      emptyMessage="Không có biến động kho trong ngày"
      columns={[
        { key: 'time', header: 'Giờ', render: (r) => fmtDate(r.time) },
        { key: 'type', header: 'Loại', render: (r) => r.typeLabel },
        { key: 'wh', header: 'Kho', render: (r) => r.warehouseName },
        { key: 'ing', header: 'NL', render: (r) => r.ingredientName },
        {
          key: 'qty',
          header: 'SL',
          align: 'right',
          render: (r) => (
            <span className={r.quantity < 0 ? 'text-red-600' : 'text-emerald-700'}>
              {r.quantity > 0 ? '+' : ''}
              {r.quantity} {r.unit}
            </span>
          ),
        },
        { key: 'bal', header: 'Tồn sau', align: 'right', render: (r) => r.balanceAfter },
      ]}
    />
  );
}

export function SupplierReceiptsPanel({ bundle }: { bundle: StoreReportBundle }) {
  const total = bundle.supplierReceipts.reduce((s, r) => s + r.totalValue, 0);
  const receipts: SupplierReceiptListItem[] = bundle.supplierReceipts.map((r) => ({
    id: r.id ?? r.documentNumber,
    supplierName: r.supplierName,
    documentNumber: r.documentNumber,
    documentDate: r.documentDate,
    warehouseCode: r.warehouseCode,
    warehouseName: r.warehouseName,
    lineCount: r.lineCount,
    totalValue: r.totalValue,
    lines: r.lines,
    note: r.note,
    createdByName: r.createdByName,
    createdAt: r.createdAt,
  }));

  return (
    <>
      <p className="text-sm text-stone-500">
        {bundle.supplierReceipts.length} phiếu NCC · Tổng giá trị nhập:{' '}
        <strong>{formatCurrency(total)}</strong>
      </p>
      <SupplierReceiptList
        receipts={receipts}
        emptyTitle="Không có phiếu NCC trong ngày"
        emptyHint=""
      />
    </>
  );
}

export function StockVouchersPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.stockVouchers}
      rowKey={(r) => r.requestNumber}
      emptyMessage="Không có phiếu kho trong ngày nghiệp vụ"
      columns={[
        { key: 'num', header: 'Số phiếu', render: (r) => r.requestNumber },
        {
          key: 'type',
          header: 'Loại',
          render: (r) =>
            STOCK_REQUEST_TYPE_LABELS[r.type as StockRequestType] ?? r.type,
        },
        {
          key: 'status',
          header: 'Trạng thái',
          render: (r) =>
            STOCK_REQUEST_STATUS_LABELS[r.status as StockRequestStatus] ?? r.status,
        },
        { key: 'from', header: 'Từ', render: (r) => r.fromWarehouse },
        { key: 'to', header: 'Đến', render: (r) => r.toWarehouse },
        { key: 'pxk', header: 'PXK', render: (r) => r.permitDocumentNumber ?? '—' },
        { key: 'nv', header: 'NV', render: (r) => r.requestedByName ?? '—' },
        {
          key: 'lines',
          header: 'Chi tiết',
          render: (r) => (
            <span className="line-clamp-2 max-w-xs text-xs text-stone-600">{r.lineSummary}</span>
          ),
        },
      ]}
    />
  );
}
