'use client';

import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { Modal } from '@/views/components/Modal';

export function UpgradeModal({
  open,
  daysLeft,
  onClose,
}: {
  open: boolean;
  daysLeft: number;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-stone-900">Sắp hết dùng thử</h2>
        <p className="mt-2 text-sm text-stone-600">
          {daysLeft <= 1
            ? 'Trial Premium còn 1 ngày. Thanh toán gói đã chọn để không bị khóa thao tác mới.'
            : `Trial Premium còn ${daysLeft} ngày. Bạn có thể thanh toán sớm bất cứ lúc nào.`}
        </p>
        <ol className="mt-4 space-y-2 text-sm text-stone-600">
          <li>1. Vào <strong>Thanh toán & hóa đơn</strong></li>
          <li>2. Chọn gói Solo / Store / Chain và số tháng</li>
          <li>3. Tạo hóa đơn → chuyển khoản → xác nhận</li>
        </ol>
        <div className="mt-4 flex gap-2">
          <Link
            href="/dashboard/admin/billing"
            onClick={onClose}
            className={`flex-1 rounded-xl py-2.5 text-center text-sm font-semibold text-white ${BRAND.primary}`}
          >
            Đi tới thanh toán
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2.5 text-sm"
          >
            Để sau
          </button>
        </div>
      </div>
    </Modal>
  );
}
