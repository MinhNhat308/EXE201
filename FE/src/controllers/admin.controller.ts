import { apiRequest } from '@/lib/api';
import { MenuItem } from '@/models/menu.model';
import { CreateEmployeePayload, User } from '@/models/user.model';

export interface ToppingConfig {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export interface PaymentMethodConfig {
  id: string;
  code: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  qrImageUrl?: string;
  bankAccountInfo?: string;
}

export const AdminMenuController = {
  getAll(): Promise<MenuItem[]> {
    return apiRequest<MenuItem[]>('/menu?forStaff=false', {
      auth: true,
      cacheTtlMs: 60_000,
    });
  },

  create(payload: Partial<MenuItem> & { toppingIds?: string[] }): Promise<MenuItem> {
    return apiRequest<MenuItem>('/menu', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(
    id: string,
    payload: Partial<MenuItem> & { toppingIds?: string[] },
  ): Promise<MenuItem> {
    return apiRequest<MenuItem>(`/menu/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/menu/${id}`, { method: 'DELETE', auth: true });
  },
};

export const AdminToppingController = {
  getAll(): Promise<ToppingConfig[]> {
    return apiRequest<ToppingConfig[]>('/toppings', {
      auth: true,
      cacheTtlMs: 60_000,
    });
  },

  create(payload: {
    name: string;
    price: number;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<ToppingConfig> {
    return apiRequest<ToppingConfig>('/toppings', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(
    id: string,
    payload: Partial<{ name: string; price: number; isActive: boolean; sortOrder: number }>,
  ): Promise<ToppingConfig> {
    return apiRequest<ToppingConfig>(`/toppings/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/toppings/${id}`, { method: 'DELETE', auth: true });
  },
};

export const AdminPaymentController = {
  getAll(includeQr = false): Promise<PaymentMethodConfig[]> {
    const q = includeQr ? '?includeQr=true' : '';
    return apiRequest<PaymentMethodConfig[]>(`/payment-methods${q}`, {
      auth: true,
      cacheTtlMs: 60_000,
    });
  },

  getOne(id: string): Promise<PaymentMethodConfig> {
    return apiRequest<PaymentMethodConfig>(`/payment-methods/${id}`, {
      auth: true,
      cacheTtlMs: 120_000,
    });
  },

  getByCode(code: string): Promise<PaymentMethodConfig | null> {
    return apiRequest<PaymentMethodConfig | null>(
      `/payment-methods/by-code/${encodeURIComponent(code)}`,
      { auth: true, cacheTtlMs: 120_000 },
    );
  },

  create(payload: {
    code: string;
    label: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<PaymentMethodConfig> {
    return apiRequest<PaymentMethodConfig>('/payment-methods', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(
    id: string,
    payload: Partial<PaymentMethodConfig>,
  ): Promise<PaymentMethodConfig> {
    return apiRequest<PaymentMethodConfig>(`/payment-methods/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/payment-methods/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};

export const AdminUserController = {
  getAll(): Promise<User[]> {
    return apiRequest<User[]>('/users', { auth: true });
  },

  getOperational(): Promise<User[]> {
    return apiRequest<User[]>('/users/operational', {
      auth: true,
      cacheTtlMs: 30_000,
    });
  },

  create(payload: CreateEmployeePayload): Promise<User> {
    return apiRequest<User>('/users', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(
    id: string,
    payload: Partial<CreateEmployeePayload> & { isActive?: boolean },
  ): Promise<User> {
    return apiRequest<User>(`/users/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/users/${id}`, { method: 'DELETE', auth: true });
  },
};
