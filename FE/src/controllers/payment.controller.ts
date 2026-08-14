import { apiRequest } from '@/lib/api';

export type PaymentConfig = {
  sepayEnabled: boolean;
  vietqrEnabled: boolean;
  paymentCodePrefix: string;
  bankAccountInfo: string | null;
};

export type PaymentTransaction = {
  id: string;
  sepayId: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  transferAmount: number;
  content: string;
  paymentCode?: string;
  referenceCode?: string;
  matchedOrderId?: string;
  matchedInvoiceId?: string;
  matchStatus: string;
  createdAt?: string;
};

export const PaymentController = {
  config() {
    return apiRequest<PaymentConfig>('/payments/config', { auth: true });
  },

  listTransactions(limit = 50) {
    return apiRequest<PaymentTransaction[]>(
      `/payments/transactions?limit=${limit}`,
      { auth: true },
    );
  },

  confirmOrderPaid(orderId: string) {
    return apiRequest(`/payments/orders/${orderId}/confirm-paid`, {
      method: 'POST',
      auth: true,
    });
  },

  refreshOrderQr(orderId: string) {
    return apiRequest(`/payments/orders/${orderId}/refresh-qr`, {
      method: 'POST',
      auth: true,
    });
  },
};
