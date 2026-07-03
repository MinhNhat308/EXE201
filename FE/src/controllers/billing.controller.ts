import { apiRequest } from '@/lib/api';
import { invalidateCache } from '@/lib/api-cache';
import { BillingInvoice } from '@/models/tenant.model';
import { SubscriptionPlan } from '@/models/tenant.model';

export type MomoCheckoutResponse = {
  invoice: BillingInvoice;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
};

export type BankTransferInfo = {
  bank: string;
  account: string;
  holder: string;
  qrUrl: string;
  note: string;
  transferPrefix: string;
};

export const BillingController = {
  momoConfig() {
    return apiRequest<{ enabled: boolean; redirectUrl: string }>('/billing/momo/config', {
      auth: true,
    });
  },

  transferInfo() {
    return apiRequest<BankTransferInfo>('/billing/transfer-info', { auth: true });
  },

  listInvoices() {
    return apiRequest<BillingInvoice[]>('/billing/invoices', { auth: true });
  },

  getInvoice(invoiceId: string) {
    return apiRequest<BillingInvoice>(`/billing/invoices/${invoiceId}`, { auth: true });
  },

  checkout(plan: SubscriptionPlan, months = 1) {
    invalidateCache('GET:/subscription');
    return apiRequest<BillingInvoice>('/billing/checkout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ plan, months }),
    });
  },

  checkoutMomo(plan: SubscriptionPlan, months = 1) {
    invalidateCache('GET:/subscription');
    invalidateCache('GET:/billing');
    return apiRequest<MomoCheckoutResponse>('/billing/checkout-momo', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ plan, months }),
    });
  },

  confirmPaid(invoiceId: string) {
    invalidateCache('GET:/subscription');
    invalidateCache('GET:/billing');
    return apiRequest(`/billing/invoices/${invoiceId}/confirm-paid`, {
      method: 'POST',
      auth: true,
    });
  },
};
