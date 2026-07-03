export enum StockRequestType {

  DISPATCH_FROM_CENTRAL = 'DISPATCH_FROM_CENTRAL',

  RETURN_TO_CENTRAL = 'RETURN_TO_CENTRAL',

  REPLENISH_FROM_CENTRAL = 'REPLENISH_FROM_CENTRAL',

}



export enum StockRequestStatus {

  DRAFT = 'DRAFT',

  PENDING = 'PENDING',

  APPROVED = 'APPROVED',

  REJECTED = 'REJECTED',

  COMPLETED = 'COMPLETED',

}



export const STOCK_REQUEST_TYPE_LABELS: Record<StockRequestType, string> = {

  [StockRequestType.DISPATCH_FROM_CENTRAL]: 'Cấp phát / bàn giao ca',

  [StockRequestType.RETURN_TO_CENTRAL]: 'Thu hồi về kho tổng (tuỳ chọn)',

  [StockRequestType.REPLENISH_FROM_CENTRAL]: 'Bổ sung tồn kho lẻ',

};



export const STOCK_REQUEST_STATUS_LABELS: Record<StockRequestStatus, string> = {

  [StockRequestStatus.PENDING]: 'Chờ kế toán duyệt',

  [StockRequestStatus.COMPLETED]: 'Đã hoàn tất',

  [StockRequestStatus.REJECTED]: 'Từ chối',

  [StockRequestStatus.APPROVED]: 'Đã duyệt',

  [StockRequestStatus.DRAFT]: 'Nháp',

};



export interface StockRequestLine {

  ingredientId: string;

  quantity: number;

  returnedQuantity?: number;

  remainingQuantity?: number;

  ingredientName?: string;

  unit?: string;

}



export interface OperationsDashboard {

  businessDate: string;

  pendingApproval: number;

  openIssuesToday: number;

  partialIssuesToday: number;

  pendingReturnsToday: number;

  completedIssuesToday: number;

  completedReturnsToday: number;

  overdueOpenIssues: number;

  needsEndOfDayReturn: number;

  todayReceiptCount: number;

  todayReceiptValue: number;

  monthReceiptCount: number;

  monthReceiptValue: number;

  expiringSoonCount: number;

}



export interface StockTransferRequest {

  id: string;

  requestNumber: string;

  type: StockRequestType;

  status: StockRequestStatus;

  fromWarehouseCode: string;

  fromWarehouseName: string;

  toWarehouseCode: string;

  toWarehouseName: string;

  permitDocumentNumber: string;

  permitDocumentDate: string;

  purpose?: string;

  note?: string;

  lines: StockRequestLine[];

  requestedByName?: string;

  submittedAt?: string;

  reviewedByName?: string;

  reviewedAt?: string;

  accountingNote?: string;

  rejectReason?: string;

  completedAt?: string;

  createdAt?: string;

  businessDate?: string;

  parentRequestId?: string;

  parentRequestNumber?: string;

  returnClosureStatus?: string;

}


