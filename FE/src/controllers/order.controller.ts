import { apiRequest } from '@/lib/api';
import { MenuItem } from '@/models/menu.model';
import {
  CreateOrderPayload,
  Order,
  OrderStatus,
  UpdateOrderPayload,
} from '@/models/order.model';
import { WorkShift } from '@/models/staff.model';
import type { TodayReport } from '@/models/today-report.model';

export const MenuController = {
  getItems(): Promise<MenuItem[]> {
    return apiRequest<MenuItem[]>('/menu?forStaff=true', {
      auth: true,
      cacheTtlMs: 120_000,
    });
  },
};

export const PaymentMethodController = {
  getActive() {
    return apiRequest<
      {
        id: string;
        code: string;
        label: string;
        description?: string;
        bankAccountInfo?: string;
      }[]
    >('/payment-methods?activeOnly=true', {
      auth: true,
      cacheTtlMs: 120_000,
    });
  },

  getByCode(code: string) {
    return apiRequest<{
      id: string;
      code: string;
      label: string;
      description?: string;
      qrImageUrl?: string;
      bankAccountInfo?: string;
    } | null>(`/payment-methods/by-code/${encodeURIComponent(code)}`, {
      auth: true,
      cacheTtlMs: 300_000,
    });
  },
};

export const OrderController = {
  /** Store/Chain — thu ngân gửi bếp (PENDING) */
  create(payload: CreateOrderPayload): Promise<Order> {
    return apiRequest<Order>('/orders', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  getToday(workShift?: WorkShift, activeOnly = false, branchId?: string, skipCache = false): Promise<Order[]> {
    const params = new URLSearchParams();
    if (workShift) params.set('workShift', workShift);
    if (activeOnly) params.set('activeOnly', 'true');
    if (branchId) params.set('branchId', branchId);
    const q = params.toString() ? `?${params}` : '';
    return apiRequest<Order[]>(`/orders/today${q}`, {
      auth: true,
      cacheTtlMs: 20_000,
      skipCache,
    });
  },

  getById(id: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}`, { auth: true });
  },

  update(id: string, payload: UpdateOrderPayload): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  cancel(id: string, cancelReason: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}/cancel`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ cancelReason }),
    });
  },

  updateKitchenStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}/kitchen-status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    });
  },

  getActive(workShift?: WorkShift): Promise<Order[]> {
    const query = workShift ? `?workShift=${workShift}` : '';
    return apiRequest<Order[]>(`/orders/active${query}`, { auth: true });
  },

  updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    });
  },

  getTodayReport(workShift?: WorkShift) {
    const q = workShift ? `?workShift=${workShift}` : '';
    return apiRequest<TodayReport>(`/orders/reports/today${q}`, {
      auth: true,
      cacheTtlMs: 30_000,
    });
  },
};
