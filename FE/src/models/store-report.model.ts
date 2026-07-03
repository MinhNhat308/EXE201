import type { TodayReport } from '@/models/today-report.model';

export type StoreReportEInvoiceConfig = {
  storeName: string;
  taxCode?: string;
  invoiceTemplate?: string;
  invoiceSerial?: string;
  vatRate: number;
  address?: string;
  phone?: string;
};

export type StoreReportSalesInvoice = {
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

export type StoreReportStockSnapshot = {
  warehouseCode: string;
  warehouseName: string;
  ingredientName: string;
  category: string;
  displayStock: number;
  displayMinStock: number;
  displayUnit: string;
  isLow: boolean;
};

export type StoreReportMovement = {
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

export type StoreReportSupplierReceiptLine = {
  ingredientName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  lineTotal: number;
};

export type StoreReportSupplierReceipt = {
  id?: string;
  documentNumber: string;
  supplierName: string;
  documentDate: string;
  warehouseCode?: string;
  warehouseName: string;
  lineCount: number;
  totalValue: number;
  lines?: StoreReportSupplierReceiptLine[];
  note?: string;
  createdByName?: string;
  createdAt?: string;
};

export type StoreReportStockVoucher = {
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
  };
  eInvoiceConfig: StoreReportEInvoiceConfig;
  summary: TodayReport;
  salesInvoices: StoreReportSalesInvoice[];
  invoiceSummary: StoreReportInvoiceSummary;
  hourly: { hour: number; label: string; orderCount: number; revenue: number }[];
  orders: {
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
  }[];
  staff: {
    staffName: string;
    orderCount: number;
    revenue: number;
    cancelledCount: number;
    averageTicket: number;
  }[];
  products: { name: string; quantity: number; revenue: number; sharePercent: number }[];
  cancellations: {
    orderNumber: string;
    invoiceNumber: string;
    cancelledAt?: string;
    staffName: string;
    total: number;
    cancelReason?: string;
  }[];
  byShift: {
    workShift: string;
    orderCount: number;
    paidCount: number;
    revenue: number;
    completedCount: number;
    servedRevenue: number;
    cancelledCount: number;
  }[];
  shiftClose: {
    workShift: string;
    sessionsCount: number;
    activeSessions: number;
    orderCount: number;
    paidRevenue: number;
    cashTotal: number;
    bankTotal: number;
    openOrders: number;
    completedOrders: number;
  }[];
  inventoryUsage: { ingredientName: string; unit: string; totalUsed: number }[];
  lowStock: {
    name: string;
    warehouseName: string;
    currentStock: number;
    minStock: number;
    unit: string;
  }[];
  stockSnapshot: StoreReportStockSnapshot[];
  stockMovements: StoreReportMovement[];
  supplierReceipts: StoreReportSupplierReceipt[];
  stockVouchers: StoreReportStockVoucher[];
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

export type StoreReportTabId =
  | 'summary'
  | 'orders'
  | 'hourly'
  | 'shifts'
  | 'staff'
  | 'products'
  | 'payments'
  | 'cancellations'
  | 'shift-close'
  | 'sales-invoices'
  | 'invoice-summary'
  | 'inventory'
  | 'stock-snapshot'
  | 'stock-movements'
  | 'supplier-receipts'
  | 'stock-vouchers';

export type StoreReportTabGroup = {
  title: string;
  tabs: StoreReportTabId[];
};

export const STORE_REPORT_TAB_GROUPS: StoreReportTabGroup[] = [
  {
    title: 'Bán hàng',
    tabs: [
      'summary',
      'orders',
      'hourly',
      'shifts',
      'staff',
      'products',
      'payments',
      'cancellations',
      'shift-close',
    ],
  },
  {
    title: 'Hóa đơn / HĐĐT',
    tabs: ['sales-invoices', 'invoice-summary'],
  },
  {
    title: 'Kho & NL',
    tabs: [
      'inventory',
      'stock-snapshot',
      'stock-movements',
      'supplier-receipts',
      'stock-vouchers',
    ],
  },
];
