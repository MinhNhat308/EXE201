import type { TodayReportResponse } from '../../orders/dto/today-report.dto';

export type StoreReportHourlyRow = {
  hour: number;
  label: string;
  orderCount: number;
  revenue: number;
};

export type StoreReportOrderRow = {
  orderNumber: string;
  invoiceNumber: string;
  createdAt: string;
  workShift: string;
  staffName: string;
  tableNumber?: string;
  customerName?: string;
  itemCount: number;
  paymentMethod: string;
  total: number;
  status: string;
};

export type StoreReportStaffRow = {
  staffName: string;
  orderCount: number;
  revenue: number;
  cancelledCount: number;
  averageTicket: number;
};

export type StoreReportProductRow = {
  name: string;
  quantity: number;
  revenue: number;
  sharePercent: number;
};

export type StoreReportCancellationRow = {
  orderNumber: string;
  invoiceNumber: string;
  cancelledAt?: string;
  staffName: string;
  total: number;
  cancelReason?: string;
};

export type StoreReportShiftRow = {
  workShift: string;
  orderCount: number;
  paidCount: number;
  revenue: number;
  completedCount: number;
  servedRevenue: number;
  cancelledCount: number;
};

export type StoreReportShiftCloseRow = {
  workShift: string;
  sessionsCount: number;
  activeSessions: number;
  orderCount: number;
  paidRevenue: number;
  cashTotal: number;
  bankTotal: number;
  openOrders: number;
  completedOrders: number;
};

export type StoreReportInventoryRow = {
  ingredientName: string;
  unit: string;
  totalUsed: number;
};

export type StoreReportLowStockRow = {
  name: string;
  warehouseName: string;
  currentStock: number;
  minStock: number;
  unit: string;
};

export type StoreReportEInvoiceConfig = {
  storeName: string;
  taxCode?: string;
  invoiceTemplate?: string;
  invoiceSerial?: string;
  vatRate: number;
  address?: string;
  phone?: string;
};

export type StoreReportSalesInvoiceRow = {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: string;
  workShift: string;
  buyerName: string;
  buyerTaxCode?: string;
  itemCount: number;
  subtotalBeforeTax: number;
  vatAmount: number;
  total: number;
  paymentMethod: string;
  status: string;
  staffName: string;
  cancelled: boolean;
};

export type StoreReportInvoiceSummary = {
  issuedCount: number;
  cancelledCount: number;
  subtotalBeforeTax: number;
  vatAmount: number;
  totalAmount: number;
  cancelledAmount: number;
  cashTotal: number;
  bankTotal: number;
};

export type StoreReportStockSnapshotRow = {
  warehouseCode: string;
  warehouseName: string;
  ingredientName: string;
  category: string;
  displayStock: number;
  displayMinStock: number;
  displayUnit: string;
  isLow: boolean;
};

export type StoreReportMovementRow = {
  time: string;
  type: string;
  typeLabel: string;
  ingredientName: string;
  unit: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: number;
  balanceAfter: number;
  note?: string;
};

export type StoreReportSupplierReceiptRow = {
  id?: string;
  documentNumber: string;
  supplierName: string;
  documentDate: string;
  warehouseCode?: string;
  warehouseName: string;
  lineCount: number;
  totalValue: number;
  lines?: {
    ingredientName: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    lineTotal: number;
  }[];
  note?: string;
  createdByName?: string;
  createdAt?: string;
};

export type StoreReportStockVoucherRow = {
  requestNumber: string;
  type: string;
  status: string;
  fromWarehouse: string;
  toWarehouse: string;
  permitDocumentNumber?: string;
  businessDate?: string;
  parentRequestNumber?: string;
  requestedByName?: string;
  reviewedByName?: string;
  lineSummary: string;
  completedAt?: string;
};

export type StoreReportBundle = {
  meta: {
    date: string;
    workShift?: string;
    generatedAt: string;
    storeName?: string;
    branchId?: string;
    branchName?: string;
    branchCount?: number;
  };
  eInvoiceConfig: StoreReportEInvoiceConfig;
  summary: TodayReportResponse;
  salesInvoices: StoreReportSalesInvoiceRow[];
  invoiceSummary: StoreReportInvoiceSummary;
  hourly: StoreReportHourlyRow[];
  orders: StoreReportOrderRow[];
  staff: StoreReportStaffRow[];
  products: StoreReportProductRow[];
  cancellations: StoreReportCancellationRow[];
  byShift: StoreReportShiftRow[];
  shiftClose: StoreReportShiftCloseRow[];
  inventoryUsage: StoreReportInventoryRow[];
  lowStock: StoreReportLowStockRow[];
  stockSnapshot: StoreReportStockSnapshotRow[];
  stockMovements: StoreReportMovementRow[];
  supplierReceipts: StoreReportSupplierReceiptRow[];
  stockVouchers: StoreReportStockVoucherRow[];
  operations: {
    pendingApproval: number;
    needsEndOfDayReturn: number;
    pendingReturnsToday: number;
    completedIssuesToday: number;
    completedReturnsToday: number;
    nccTodayCount: number;
    nccTodayValue: number;
  };
};
