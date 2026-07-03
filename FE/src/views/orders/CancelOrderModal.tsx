'use client';

import { useState } from 'react';
import { Order } from '@/models/order.model';
import { Modal } from '@/views/components/Modal';

interface CancelOrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  /** Solo: hóa đơn đã lưu vẫn hủy được (trừ CK) */
  soloMode?: boolean;
}

export function CancelOrderModal({
  order,
  open,
  onClose,
  onConfirm,
  soloMode = false,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBankTransfer = order?.paymentMethod === 'BANK_TRANSFER';

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Vui lòng nhập lý do hủy (ít nhất 3 ký tự)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hủy đơn thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-red-700">
          {soloMode ? 'Hủy hóa đơn' : 'Hủy đơn'} #{order?.invoiceNumber ?? order?.orderNumber}
        </h2>

        {isBankTransfer ? (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Đơn thanh toán <strong>chuyển khoản</strong> không thể hủy vì không hoàn
            tiền được cho khách.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-stone-500">
              {soloMode
                ? 'Hóa đơn sẽ bị hủy và không còn tính vào doanh thu hôm nay.'
                : 'Chỉ hủy được khi đơn còn trạng thái "Chưa thực hiện".'}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-4 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              placeholder="Nhập lý do hủy đơn..."
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border py-2.5 text-sm"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </>
        )}

        {isBankTransfer && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl border py-2.5 text-sm"
          >
            Đóng
          </button>
        )}
      </div>
    </Modal>
  );
}
