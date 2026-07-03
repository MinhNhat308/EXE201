import { redirect } from 'next/navigation';

/** Chuyển kho nội bộ — dùng phiếu bổ sung / cấp phát thay vì API transfer cũ */
export default function AccountingTransferPage() {
  redirect('/dashboard/accounting/requests?hint=use-stock-requests');
}
