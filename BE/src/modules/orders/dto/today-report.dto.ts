export type TodayReportTopItem = {
  name: string;
  quantity: number;
};

export type TodayReportShiftBucket = {
  count: number;
  paid: number;
  completed: number;
  revenue: number;
  servedRevenue: number;
};

export type TodayReportStatusBucket = {
  count: number;
  revenue: number;
};

export type TodayReportPaymentBucket = {
  count: number;
  total: number;
  label?: string;
};

export type TodayReportResponse = {
  orderCount: number;
  paidCount: number;
  completedCount: number;
  cancelledCount: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  /** Doanh thu đã thu tại quầy (mọi đơn không hủy) */
  revenue: number;
  /** Doanh thu đơn đã giao khách (COMPLETED) */
  servedRevenue: number;
  averageTicket: number;
  cashTotal: number;
  bankTotal: number;
  byShift: Record<string, TodayReportShiftBucket>;
  byStatus: Record<string, TodayReportStatusBucket>;
  byPaymentMethod: Record<string, TodayReportPaymentBucket>;
  topItems: TodayReportTopItem[];
};
