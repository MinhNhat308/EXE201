import { formatCurrency } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/models/order.model';
import type { StoreReportBundle, StoreReportTabId } from '@/models/store-report.model';
import { WORK_SHIFT_LABELS } from '@/models/staff.model';
import type { ExcelSheet } from '@/lib/excel-export';

export type ReportTabDef = {
  id: StoreReportTabId;
  label: string;
  icon: string;
  description: string;
};

export const STORE_REPORT_TABS: ReportTabDef[] = [
  {
    id: 'summary',
    label: 'Tổng hợp doanh thu',
    icon: '📊',
    description: 'KPI chính, pipeline đơn, thanh toán',
  },
  {
    id: 'orders',
    label: 'Sổ đơn hàng',
    icon: '🧾',
    description: 'Chi tiết từng đơn trong ngày',
  },
  {
    id: 'hourly',
    label: 'Theo giờ',
    icon: '🕐',
    description: 'Doanh thu và số đơn theo khung giờ',
  },
  {
    id: 'shifts',
    label: 'Theo ca',
    icon: '⏰',
    description: 'So sánh ca sáng / trưa / chiều / tối',
  },
  {
    id: 'staff',
    label: 'Theo nhân viên',
    icon: '👤',
    description: 'Hiệu suất thu ngân từng NV',
  },
  {
    id: 'products',
    label: 'Món bán chạy',
    icon: '🥤',
    description: 'Số lượng & doanh thu theo món',
  },
  {
    id: 'payments',
    label: 'Thanh toán',
    icon: '💳',
    description: 'Phân tích hình thức thanh toán',
  },
  {
    id: 'cancellations',
    label: 'Đơn hủy',
    icon: '❌',
    description: 'Đơn bị hủy và lý do',
  },
  {
    id: 'shift-close',
    label: 'Chốt ca (Z-report)',
    icon: '📋',
    description: 'Tổng kết cuối ca — TM/CK, đơn mở',
  },
  {
    id: 'sales-invoices',
    label: 'Sổ hóa đơn bán',
    icon: '🧾',
    description: 'Danh sách HĐ bán hàng — mẫu HĐĐT',
  },
  {
    id: 'invoice-summary',
    label: 'Tổng hợp thuế GTGT',
    icon: '📑',
    description: 'Tiền hàng, thuế, TM/CK theo ngày',
  },
  {
    id: 'inventory',
    label: 'Tiêu hao NL',
    icon: '📦',
    description: 'NL tiêu hao từ đơn bếp READY',
  },
  {
    id: 'stock-snapshot',
    label: 'Tồn kho hiện tại',
    icon: '🏪',
    description: 'Snapshot tồn tất cả kho',
  },
  {
    id: 'stock-movements',
    label: 'Nhật ký xuất nhập',
    icon: '📒',
    description: 'Sổ cái kho trong ngày',
  },
  {
    id: 'supplier-receipts',
    label: 'Phiếu NCC',
    icon: '🏭',
    description: 'Nhập hàng nhà cung cấp',
  },
  {
    id: 'stock-vouchers',
    label: 'Phiếu kho ca',
    icon: '📤',
    description: 'Cấp phát, hoàn trả, bổ sung',
  },
];

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
};

function shiftLabel(s: string) {
  return WORK_SHIFT_LABELS[s as keyof typeof WORK_SHIFT_LABELS] ?? s;
}

function pmLabel(code: string) {
  return PAYMENT_LABELS[code] ?? code;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export function buildExcelSheets(
  bundle: StoreReportBundle,
  tabId?: StoreReportTabId,
): ExcelSheet[] {
  const { meta, summary } = bundle;

  const allSheets: ExcelSheet[] = [
    {
      name: 'Tong_hop',
      rows: [
        { 'Ngày': meta.date, 'Cửa hàng': meta.storeName ?? '', 'Ca lọc': meta.workShift ?? 'Tất cả' },
        { 'Doanh thu thu': summary.revenue, 'Đơn đã thu': summary.paidCount },
        { 'TB/đơn': summary.averageTicket, 'Đã hủy': summary.cancelledCount },
        { 'Chờ bếp': summary.pendingCount, 'Đang làm': summary.preparingCount },
        { 'Sẵn bưng': summary.readyCount, 'Đã giao': summary.completedCount },
        { 'Tiền mặt': summary.cashTotal, 'Chuyển khoản': summary.bankTotal },
        {
          'Phiếu NCC': bundle.operations.nccTodayCount,
          'Giá trị NCC': bundle.operations.nccTodayValue,
        },
      ],
    },
    {
      name: 'Don_hang',
      rows: bundle.orders.map((o) => ({
        'Mã đơn': o.orderNumber,
        'Hóa đơn': o.invoiceNumber,
        'Thời gian': fmtDate(o.createdAt),
        'Ca': shiftLabel(o.workShift),
        'NV': o.staffName,
        'Bàn': o.tableNumber ?? '',
        'Khách': o.customerName ?? '',
        'Số món': o.itemCount,
        'HTTT': pmLabel(o.paymentMethod),
        'Tổng': o.total,
        'Trạng thái': ORDER_STATUS_LABELS[o.status] ?? o.status,
      })),
    },
    {
      name: 'Theo_gio',
      rows: bundle.hourly.map((h) => ({
        'Khung giờ': h.label,
        'Số đơn': h.orderCount,
        'Doanh thu': h.revenue,
      })),
    },
    {
      name: 'Theo_ca',
      rows: bundle.byShift.map((s) => ({
        'Ca': shiftLabel(s.workShift),
        'Tổng đơn': s.orderCount,
        'Đã thu': s.paidCount,
        'Doanh thu': s.revenue,
        'Đã giao': s.completedCount,
        'DT giao': s.servedRevenue,
        'Hủy': s.cancelledCount,
      })),
    },
    {
      name: 'Theo_NV',
      rows: bundle.staff.map((s) => ({
        'Nhân viên': s.staffName,
        'Số đơn': s.orderCount,
        'Doanh thu': s.revenue,
        'TB/đơn': s.averageTicket,
        'Đơn hủy': s.cancelledCount,
      })),
    },
    {
      name: 'Mon_ban',
      rows: bundle.products.map((p) => ({
        'Món': p.name,
        'Số ly': p.quantity,
        'Doanh thu': p.revenue,
        '% DT': p.sharePercent,
      })),
    },
    {
      name: 'Thanh_toan',
      rows: Object.entries(summary.byPaymentMethod).map(([code, b]) => ({
        'Hình thức': pmLabel(code),
        'Mã': code,
        'Số đơn': b.count,
        'Tổng tiền': b.total,
      })),
    },
    {
      name: 'Don_huy',
      rows: bundle.cancellations.map((c) => ({
        'Mã đơn': c.orderNumber,
        'HĐ': c.invoiceNumber,
        'NV': c.staffName,
        'Giá trị': c.total,
        'Lý do': c.cancelReason ?? '',
        'Thời gian': c.cancelledAt ? fmtDate(c.cancelledAt) : '',
      })),
    },
    {
      name: 'Chot_ca',
      rows: bundle.shiftClose.map((s) => ({
        'Ca': shiftLabel(s.workShift),
        'NV check-in': s.sessionsCount,
        'Ca đang mở': s.activeSessions,
        'Tổng đơn': s.orderCount,
        'DT thu': s.paidRevenue,
        'Tiền mặt': s.cashTotal,
        'Chuyển khoản': s.bankTotal,
        'Đơn chưa giao': s.openOrders,
        'Đã giao': s.completedOrders,
      })),
    },
    {
      name: 'Tieu_hao',
      rows: bundle.inventoryUsage.map((u) => ({
        'Nguyên liệu': u.ingredientName,
        'Đã dùng': u.totalUsed,
        'ĐVT': u.unit,
      })),
    },
    {
      name: 'Ton_thap',
      rows: bundle.lowStock.map((l) => ({
        'NL': l.name,
        'Kho': l.warehouseName,
        'Tồn': l.currentStock,
        'Tối thiểu': l.minStock,
        'ĐVT': l.unit,
      })),
    },
    {
      name: 'So_HDDT',
      rows: bundle.salesInvoices.map((inv, idx) => ({
        'STT': idx + 1,
        'Số HĐ': inv.invoiceNumber,
        'Mẫu số': bundle.eInvoiceConfig.invoiceTemplate ?? '',
        'Ký hiệu': bundle.eInvoiceConfig.invoiceSerial ?? '',
        'Ngày': fmtDate(inv.issuedAt),
        'Khách': inv.buyerName,
        'Tiền hàng': inv.subtotalBeforeTax,
        'Thuế GTGT': inv.vatAmount,
        'Tổng TT': inv.total,
        'HTTT': pmLabel(inv.paymentMethod),
        'Trạng thái': inv.cancelled ? 'Đã hủy' : 'Hợp lệ',
      })),
    },
    {
      name: 'Tong_hop_thue',
      rows: [
        {
          'Ngày': bundle.meta.date,
          'Số HĐ phát hành': bundle.invoiceSummary.issuedCount,
          'Số HĐ hủy': bundle.invoiceSummary.cancelledCount,
          'Tiền hàng': bundle.invoiceSummary.subtotalBeforeTax,
          'Thuế GTGT': bundle.invoiceSummary.vatAmount,
          'Tổng thanh toán': bundle.invoiceSummary.totalAmount,
          'Tiền mặt': bundle.invoiceSummary.cashTotal,
          'Chuyển khoản': bundle.invoiceSummary.bankTotal,
        },
      ],
    },
    {
      name: 'Ton_kho_snapshot',
      rows: bundle.stockSnapshot.map((s) => ({
        'Kho': s.warehouseName,
        'Mã kho': s.warehouseCode,
        'Nguyên liệu': s.ingredientName,
        'Nhóm': s.category,
        'Tồn': s.displayStock,
        'Tối thiểu': s.displayMinStock,
        'ĐVT': s.displayUnit,
        'Cảnh báo': s.isLow ? 'Thấp' : 'OK',
      })),
    },
    {
      name: 'Nhat_ky_kho',
      rows: bundle.stockMovements.map((m) => ({
        'Thời gian': fmtDate(m.time),
        'Loại': m.typeLabel,
        'Kho': m.warehouseName,
        'Nguyên liệu': m.ingredientName,
        'SL': m.quantity,
        'Tồn sau': m.balanceAfter,
        'Ghi chú': m.note ?? '',
      })),
    },
    {
      name: 'Phieu_NCC',
      rows: bundle.supplierReceipts.map((r) => ({
        'Số CT': r.documentNumber,
        'NCC': r.supplierName,
        'Ngày': fmtDate(r.documentDate),
        'Kho': r.warehouseName,
        'Số dòng': r.lineCount,
        'Giá trị': r.totalValue,
        'Người lập': r.createdByName ?? '',
        'Ghi chú': r.note ?? '',
      })),
    },
    {
      name: 'Chi_tiet_NCC',
      rows: bundle.supplierReceipts.flatMap((r) =>
        (r.lines ?? []).map((line) => ({
          'Số CT': r.documentNumber,
          'NCC': r.supplierName,
          'Ngày': fmtDate(r.documentDate),
          'Nguyên liệu': line.ingredientName,
          'ĐVT': line.unit ?? '',
          'SL': line.quantity,
          'Đơn giá': line.unitPrice,
          'Thành tiền': line.lineTotal,
        })),
      ),
    },
    {
      name: 'Phieu_kho',
      rows: bundle.stockVouchers.map((v) => ({
        'Số phiếu': v.requestNumber,
        'Loại': v.type,
        'Trạng thái': v.status,
        'Từ': v.fromWarehouse,
        'Đến': v.toWarehouse,
        'Số PXK': v.permitDocumentNumber ?? '',
        'NV': v.requestedByName ?? '',
        'Chi tiết': v.lineSummary,
      })),
    },
  ];

  if (!tabId) return allSheets;

  const tabSheetMap: Record<StoreReportTabId, string | string[]> = {
    summary: 'Tong_hop',
    orders: 'Don_hang',
    hourly: 'Theo_gio',
    shifts: 'Theo_ca',
    staff: 'Theo_NV',
    products: 'Mon_ban',
    payments: 'Thanh_toan',
    cancellations: 'Don_huy',
    'shift-close': 'Chot_ca',
    'sales-invoices': 'So_HDDT',
    'invoice-summary': 'Tong_hop_thue',
    inventory: ['Tieu_hao', 'Ton_thap'],
    'stock-snapshot': 'Ton_kho_snapshot',
    'stock-movements': 'Nhat_ky_kho',
    'supplier-receipts': ['Phieu_NCC', 'Chi_tiet_NCC'],
    'stock-vouchers': 'Phieu_kho',
  };

  const mapped = tabSheetMap[tabId];
  if (!mapped) return allSheets.slice(0, 1);
  const names = Array.isArray(mapped) ? mapped : [mapped];
  return allSheets.filter((s) => names.includes(s.name));
}

export { formatCurrency, shiftLabel, pmLabel, fmtDate, ORDER_STATUS_LABELS };
