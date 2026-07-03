export type ReceiptMoneyLine = {
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type ReceiptMoneySource = {
  documentDate: string;
  totalValue?: number;
  lines?: ReceiptMoneyLine[];
};

export function receiptMoneyTotal(r: ReceiptMoneySource): number {
  if (r.totalValue != null && r.totalValue > 0) return r.totalValue;
  return (r.lines ?? []).reduce(
    (s, l) => s + (l.lineTotal ?? l.quantity * (l.unitPrice ?? 0)),
    0,
  );
}

export function sumReceiptMoney(receipts: ReceiptMoneySource[]): number {
  return receipts.reduce((s, r) => s + receiptMoneyTotal(r), 0);
}

export function filterReceiptsByLocalDate(
  receipts: ReceiptMoneySource[],
  dateStr: string,
): ReceiptMoneySource[] {
  return receipts.filter(
    (r) => new Date(r.documentDate).toISOString().slice(0, 10) === dateStr,
  );
}
