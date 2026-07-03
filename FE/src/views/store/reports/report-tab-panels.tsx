'use client';

import type { StoreReportBundle, StoreReportTabId } from '@/models/store-report.model';
import { ORDER_STATUS_LABELS } from '@/models/order.model';
import { ReportDataTable } from '@/views/store/reports/ReportDataTable';
import {
  InvoiceSummaryPanel,
  SalesInvoicesPanel,
  StockMovementsPanel,
  StockSnapshotPanel,
  StockVouchersPanel,
  SupplierReceiptsPanel,
} from '@/views/store/reports/StoreReportExtraPanels';
import {
  formatCurrency,
  fmtDate,
  pmLabel,
  shiftLabel,
} from '@/views/store/reports/report-definitions';
import { useReportViewMode } from '@/views/store/reports/ReportViewContext';

export function renderReportTabContent(
  activeTab: StoreReportTabId,
  bundle: StoreReportBundle,
) {
  switch (activeTab) {
    case 'summary':
      return <SummaryPanel bundle={bundle} />;
    case 'orders':
      return <OrdersPanel bundle={bundle} />;
    case 'hourly':
      return <HourlyPanel bundle={bundle} />;
    case 'shifts':
      return <ShiftsPanel bundle={bundle} />;
    case 'staff':
      return <StaffPanel bundle={bundle} />;
    case 'products':
      return <ProductsPanel bundle={bundle} />;
    case 'payments':
      return <PaymentsPanel bundle={bundle} />;
    case 'cancellations':
      return <CancellationsPanel bundle={bundle} />;
    case 'shift-close':
      return <ShiftClosePanel bundle={bundle} />;
    case 'sales-invoices':
      return <SalesInvoicesPanel bundle={bundle} />;
    case 'invoice-summary':
      return <InvoiceSummaryPanel bundle={bundle} />;
    case 'inventory':
      return <InventoryPanel bundle={bundle} />;
    case 'stock-snapshot':
      return <StockSnapshotPanel bundle={bundle} />;
    case 'stock-movements':
      return <StockMovementsPanel bundle={bundle} />;
    case 'supplier-receipts':
      return <SupplierReceiptsPanel bundle={bundle} />;
    case 'stock-vouchers':
      return <StockVouchersPanel bundle={bundle} />;
    default:
      return null;
  }
}

function SummaryPanel({ bundle }: { bundle: StoreReportBundle }) {
  const s = bundle.summary;
  const mode = useReportViewMode();

  if (mode === 'screen') {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Doanh thu thu ngân" value={formatCurrency(s.revenue)} accent />
          <KpiCard label="Đơn đã thu" value={String(s.paidCount)} />
          <KpiCard label="Trung bình / đơn" value={formatCurrency(s.averageTicket)} />
          <KpiCard label="Đơn hủy" value={String(s.cancelledCount)} warn />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Phiếu NCC" value={String(bundle.operations.nccTodayCount)} />
          <KpiCard
            label="Giá trị nhập NCC"
            value={formatCurrency(bundle.operations.nccTodayValue)}
            accent
          />
          <KpiCard label="Chờ bếp" value={String(s.pendingCount)} />
          <KpiCard label="Đã giao khách" value={String(s.completedCount)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <KpiCard label="Đang làm" value={String(s.preparingCount)} />
          <KpiCard label="Sẵn bưng" value={String(s.readyCount)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-stone-400">Thanh toán</h3>
            <p className="mt-2 text-sm">
              Tiền mặt: <strong>{formatCurrency(s.cashTotal)}</strong>
            </p>
            <p className="text-sm">
              Chuyển khoản: <strong>{formatCurrency(s.bankTotal)}</strong>
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-stone-400">Top 5 món</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {s.topItems.slice(0, 5).map((i) => (
                <li key={i.name} className="flex justify-between">
                  <span>{i.name}</span>
                  <span className="font-semibold">{i.quantity} ly</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <OperationsStrip ops={bundle.operations} />
      </>
    );
  }

  return (
    <>
      <DocumentKpiGrid
        rows={[
          { label: 'Doanh thu thu ngân', value: formatCurrency(s.revenue), highlight: true },
          { label: 'Đơn đã thu', value: String(s.paidCount) },
          { label: 'Trung bình / đơn', value: formatCurrency(s.averageTicket) },
          { label: 'Đơn hủy', value: String(s.cancelledCount), warn: true },
          { label: 'Phiếu NCC', value: String(bundle.operations.nccTodayCount) },
          {
            label: 'Giá trị nhập NCC',
            value: formatCurrency(bundle.operations.nccTodayValue),
            highlight: true,
          },
          { label: 'Chờ bếp', value: String(s.pendingCount) },
          { label: 'Đang làm', value: String(s.preparingCount) },
          { label: 'Sẵn bưng', value: String(s.readyCount) },
          { label: 'Đã giao khách', value: String(s.completedCount) },
        ]}
      />
      <ReportDataTable
        rows={[
          { label: 'Tiền mặt', value: formatCurrency(s.cashTotal) },
          { label: 'Chuyển khoản / CK', value: formatCurrency(s.bankTotal) },
          { label: 'Doanh thu đã phục vụ', value: formatCurrency(s.servedRevenue) },
        ]}
        rowKey={(r) => r.label}
        caption="Tổng hợp thanh toán & phục vụ"
        columns={[
          { key: 'label', header: 'Chỉ tiêu', render: (r) => r.label },
          {
            key: 'value',
            header: 'Giá trị',
            align: 'right',
            render: (r) => <strong>{r.value}</strong>,
          },
        ]}
      />
      <ReportDataTable
        rows={s.topItems.slice(0, 10)}
        rowKey={(r) => r.name}
        caption="Top món bán chạy"
        columns={[
          { key: 'name', header: 'Tên món', render: (r) => r.name },
          { key: 'qty', header: 'Số lượng', align: 'right', render: (r) => `${r.quantity} ly` },
        ]}
      />
      <OperationsStrip ops={bundle.operations} />
    </>
  );
}

function DocumentKpiGrid({
  rows,
}: {
  rows: { label: string; value: string; highlight?: boolean; warn?: boolean }[];
}) {
  return (
    <ReportDataTable
      rows={rows}
      rowKey={(r) => r.label}
      caption="Chỉ tiêu chính"
      columns={[
        { key: 'label', header: 'Chỉ tiêu', render: (r) => r.label },
        {
          key: 'value',
          header: 'Giá trị',
          align: 'right',
          render: (r) => (
            <strong
              className={
                r.warn ? 'text-red-700' : r.highlight ? 'text-[#1e5bb8]' : 'text-stone-900'
              }
            >
              {r.value}
            </strong>
          ),
        },
      ]}
    />
  );
}

function OrdersPanel({ bundle }: { bundle: StoreReportBundle }) {
  const total = bundle.orders.reduce((s, o) => s + o.total, 0);
  return (
    <ReportDataTable
      rows={bundle.orders}
      rowKey={(r) => r.orderNumber}
      caption={`Sổ đơn hàng · Tổng ${formatCurrency(total)}`}
      columns={[
        { key: 'orderNumber', header: 'Mã đơn', render: (r) => r.orderNumber },
        { key: 'time', header: 'Giờ', render: (r) => fmtDate(r.createdAt) },
        { key: 'shift', header: 'Ca', render: (r) => shiftLabel(r.workShift) },
        { key: 'staff', header: 'NV', render: (r) => r.staffName },
        { key: 'table', header: 'Bàn', render: (r) => r.tableNumber ?? '—' },
        { key: 'items', header: 'Món', align: 'right', render: (r) => r.itemCount },
        { key: 'pm', header: 'HTTT', render: (r) => pmLabel(r.paymentMethod) },
        {
          key: 'total',
          header: 'Tổng',
          align: 'right',
          render: (r) => formatCurrency(r.total),
        },
        {
          key: 'status',
          header: 'Trạng thái',
          render: (r) => ORDER_STATUS_LABELS[r.status] ?? r.status,
        },
      ]}
    />
  );
}

function HourlyPanel({ bundle }: { bundle: StoreReportBundle }) {
  const mode = useReportViewMode();
  const maxRev = Math.max(...bundle.hourly.map((h) => h.revenue), 1);

  return (
    <>
      {mode === 'screen' && (
        <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
          {bundle.hourly.map((h) => (
            <div key={h.hour} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-stone-500">{h.label}</span>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-lg bg-stone-100">
                  <div
                    className="flex h-full items-center rounded-lg bg-[#2F80ED]/80 px-2 text-xs font-semibold text-white"
                    style={{ width: `${Math.max(8, (h.revenue / maxRev) * 100)}%` }}
                  >
                    {h.orderCount > 0 && formatCurrency(h.revenue)}
                  </div>
                </div>
              </div>
              <span className="w-16 text-right text-stone-600">{h.orderCount} đơn</span>
            </div>
          ))}
        </div>
      )}
      <ReportDataTable
      rows={bundle.hourly}
      rowKey={(r) => String(r.hour)}
      caption="Doanh thu theo khung giờ"
      columns={[
        { key: 'label', header: 'Khung giờ', render: (r) => r.label },
        { key: 'count', header: 'Số đơn', align: 'right', render: (r) => r.orderCount },
        {
          key: 'rev',
          header: 'Doanh thu',
          align: 'right',
          render: (r) => formatCurrency(r.revenue),
        },
      ]}
    />
    </>
  );
}

function ShiftsPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.byShift}
      rowKey={(r) => r.workShift}
      caption="So sánh theo ca làm việc"
      columns={[
        { key: 'shift', header: 'Ca', render: (r) => shiftLabel(r.workShift) },
        { key: 'total', header: 'Tổng đơn', align: 'right', render: (r) => r.orderCount },
        { key: 'paid', header: 'Đã thu', align: 'right', render: (r) => r.paidCount },
        {
          key: 'rev',
          header: 'Doanh thu',
          align: 'right',
          render: (r) => formatCurrency(r.revenue),
        },
        { key: 'done', header: 'Đã giao', align: 'right', render: (r) => r.completedCount },
        {
          key: 'served',
          header: 'DT giao',
          align: 'right',
          render: (r) => formatCurrency(r.servedRevenue),
        },
        { key: 'cancel', header: 'Hủy', align: 'right', render: (r) => r.cancelledCount },
      ]}
    />
  );
}

function StaffPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.staff}
      rowKey={(r) => r.staffName}
      caption="Hiệu suất theo nhân viên"
      columns={[
        { key: 'name', header: 'Nhân viên', render: (r) => r.staffName },
        { key: 'orders', header: 'Số đơn', align: 'right', render: (r) => r.orderCount },
        {
          key: 'rev',
          header: 'Doanh thu',
          align: 'right',
          render: (r) => formatCurrency(r.revenue),
        },
        {
          key: 'avg',
          header: 'TB/đơn',
          align: 'right',
          render: (r) => formatCurrency(r.averageTicket),
        },
        { key: 'cancel', header: 'Hủy', align: 'right', render: (r) => r.cancelledCount },
      ]}
    />
  );
}

function ProductsPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.products}
      rowKey={(r) => r.name}
      caption="Doanh thu & số lượng theo món"
      columns={[
        { key: 'name', header: 'Món', render: (r) => r.name },
        { key: 'qty', header: 'Số ly', align: 'right', render: (r) => r.quantity },
        {
          key: 'rev',
          header: 'Doanh thu',
          align: 'right',
          render: (r) => formatCurrency(r.revenue),
        },
        { key: 'share', header: '% DT', align: 'right', render: (r) => `${r.sharePercent}%` },
      ]}
    />
  );
}

function PaymentsPanel({ bundle }: { bundle: StoreReportBundle }) {
  const mode = useReportViewMode();
  const rows = Object.entries(bundle.summary.byPaymentMethod).map(([code, b]) => ({
    code,
    ...b,
  }));
  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <>
      {mode === 'screen' && (
        <div className="grid gap-3 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.code} className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-stone-400">{pmLabel(r.code)}</p>
              <p className="mt-1 text-xl font-bold text-[#2F80ED]">{formatCurrency(r.total)}</p>
              <p className="text-xs text-stone-500">
                {r.count} đơn ·{' '}
                {total > 0 ? Math.round((r.total / total) * 1000) / 10 : 0}% tổng DT
              </p>
            </div>
          ))}
        </div>
      )}
      <ReportDataTable
      rows={rows}
      rowKey={(r) => r.code}
      caption={`Phân tích hình thức thanh toán · Tổng ${formatCurrency(total)}`}
      columns={[
        { key: 'label', header: 'Hình thức', render: (r) => pmLabel(r.code) },
        { key: 'code', header: 'Mã', render: (r) => r.code },
        { key: 'count', header: 'Số đơn', align: 'right', render: (r) => r.count },
        {
          key: 'total',
          header: 'Tổng tiền',
          align: 'right',
          render: (r) => formatCurrency(r.total),
        },
        {
          key: 'pct',
          header: '%',
          align: 'right',
          render: (r) => `${total > 0 ? Math.round((r.total / total) * 1000) / 10 : 0}%`,
        },
      ]}
    />
    </>
  );
}

function CancellationsPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.cancellations}
      rowKey={(r) => r.orderNumber}
      caption="Danh sách đơn hủy"
      emptyMessage="Không có đơn hủy trong ngày này"
      columns={[
        { key: 'order', header: 'Mã đơn', render: (r) => r.orderNumber },
        { key: 'inv', header: 'HĐ', render: (r) => r.invoiceNumber },
        { key: 'staff', header: 'NV', render: (r) => r.staffName },
        {
          key: 'total',
          header: 'Giá trị',
          align: 'right',
          render: (r) => formatCurrency(r.total),
        },
        { key: 'reason', header: 'Lý do', render: (r) => r.cancelReason ?? '—' },
        {
          key: 'at',
          header: 'Thời gian',
          render: (r) => (r.cancelledAt ? fmtDate(r.cancelledAt) : '—'),
        },
      ]}
    />
  );
}

function ShiftClosePanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <ReportDataTable
      rows={bundle.shiftClose}
      rowKey={(r) => r.workShift}
      caption="Báo cáo chốt ca (Z-report)"
      columns={[
        { key: 'shift', header: 'Ca', render: (r) => shiftLabel(r.workShift) },
        { key: 'sessions', header: 'NV check-in', align: 'right', render: (r) => r.sessionsCount },
        { key: 'active', header: 'Ca mở', align: 'right', render: (r) => r.activeSessions },
        { key: 'orders', header: 'Tổng đơn', align: 'right', render: (r) => r.orderCount },
        {
          key: 'rev',
          header: 'DT thu',
          align: 'right',
          render: (r) => formatCurrency(r.paidRevenue),
        },
        {
          key: 'cash',
          header: 'Tiền mặt',
          align: 'right',
          render: (r) => formatCurrency(r.cashTotal),
        },
        {
          key: 'bank',
          header: 'CK',
          align: 'right',
          render: (r) => formatCurrency(r.bankTotal),
        },
        { key: 'open', header: 'Chưa giao', align: 'right', render: (r) => r.openOrders },
        { key: 'done', header: 'Đã giao', align: 'right', render: (r) => r.completedOrders },
      ]}
    />
  );
}

function InventoryPanel({ bundle }: { bundle: StoreReportBundle }) {
  return (
    <>
      <OperationsStrip ops={bundle.operations} />
      <ReportDataTable
        rows={bundle.inventoryUsage}
        rowKey={(r) => r.ingredientName}
        caption="Tiêu hao nguyên liệu (kho bếp)"
        emptyMessage="Chưa có xuất kho — cần đơn bếp READY"
        columns={[
          { key: 'name', header: 'Nguyên liệu', render: (r) => r.ingredientName },
          {
            key: 'used',
            header: 'Đã dùng',
            align: 'right',
            render: (r) => `${r.totalUsed} ${r.unit}`,
          },
        ]}
      />
      {bundle.lowStock.length > 0 && (
        <ReportDataTable
          rows={bundle.lowStock}
          rowKey={(r) => `${r.name}-${r.warehouseName}`}
          caption="Cảnh báo tồn dưới mức tối thiểu"
          columns={[
            { key: 'name', header: 'NL', render: (r) => r.name },
            { key: 'wh', header: 'Kho', render: (r) => r.warehouseName },
            {
              key: 'stock',
              header: 'Tồn',
              align: 'right',
              render: (r) => `${r.currentStock} ${r.unit}`,
            },
            {
              key: 'min',
              header: 'Tối thiểu',
              align: 'right',
              render: (r) => `${r.minStock} ${r.unit}`,
            },
          ]}
        />
      )}
    </>
  );
}

function OperationsStrip({ ops }: { ops: StoreReportBundle['operations'] }) {
  const mode = useReportViewMode();
  const items = [
    { label: 'Phiếu chờ duyệt', value: String(ops.pendingApproval) },
    { label: 'Cấp phát hôm nay', value: String(ops.completedIssuesToday) },
    { label: 'Thu hồi (tuỳ chọn)', value: String(ops.completedReturnsToday) },
    { label: 'Phiếu NCC', value: String(ops.nccTodayCount) },
    { label: 'Giá trị NCC', value: formatCurrency(ops.nccTodayValue) },
  ];

  if (mode === 'screen') {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <KpiCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    );
  }

  return (
    <ReportDataTable
      rows={items}
      rowKey={(r) => r.label}
      caption="Tình hình nghiệp vụ kho"
      columns={[
        { key: 'label', header: 'Chỉ tiêu', render: (r) => r.label },
        { key: 'value', header: 'Số lượng', align: 'right', render: (r) => r.value },
      ]}
    />
  );
}

function KpiCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-stone-400">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          warn ? 'text-red-600' : accent ? 'text-[#2F80ED]' : 'text-stone-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
