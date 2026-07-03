export enum StockRequestType {
  /** Cấp phát đầu ca — bắt buộc hoàn trả cuối ngày (quản lý cửa hàng) */
  DISPATCH_FROM_CENTRAL = 'DISPATCH_FROM_CENTRAL',
  /** Hoàn trả cuối ca — gắn phiếu cấp phát (quản lý cửa hàng) */
  RETURN_TO_CENTRAL = 'RETURN_TO_CENTRAL',
  /** Bổ sung tồn kho lẻ — không yêu cầu hoàn trả (nhân viên kho) */
  REPLENISH_FROM_CENTRAL = 'REPLENISH_FROM_CENTRAL',
}

export const STOCK_REQUEST_TYPE_LABELS: Record<StockRequestType, string> = {
  [StockRequestType.DISPATCH_FROM_CENTRAL]: 'Cấp phát / bàn giao ca (kho tổng → kho con)',
  [StockRequestType.RETURN_TO_CENTRAL]: 'Thu hồi về kho tổng (tuỳ chọn)',
  [StockRequestType.REPLENISH_FROM_CENTRAL]: 'Bổ sung tồn (kho tổng → kho lẻ)',
};
