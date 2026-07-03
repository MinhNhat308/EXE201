import { apiRequest } from '@/lib/api';
import { saveAuth, clearAuth } from '@/lib/auth-storage';
import { endStaffSessionRemote } from '@/lib/staff-session-storage';
import {
  AuthResponse,
  CreateEmployeePayload,
  LoginPayload,
  User,
} from '@/models/user.model';

export const AuthController = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    saveAuth(response.accessToken, response.user, {
      tenant: response.tenant,
      subscription: response.subscription,
      trialDaysLeft: response.trialDaysLeft,
      plan: response.plan,
      status: response.status,
    });
    return response;
  },

  logout() {
    void endStaffSessionRemote();
    clearAuth();
  },

  async getProfile(): Promise<User> {
    return apiRequest<User>('/users/me', { auth: true });
  },

  async getSession() {
    return apiRequest<{
      tenant: object;
      subscription: object;
      trialDaysLeft: number;
      daysLeft: number;
      plan: string;
      status: string;
    }>('/auth/session', { auth: true, cacheTtlMs: 60_000 });
  },

  async completeOnboarding(): Promise<{ tenant: Record<string, unknown> }> {
    return apiRequest<{ tenant: Record<string, unknown> }>('/auth/onboarding/complete', {
      method: 'POST',
      auth: true,
    });
  },

  async updateTenant(payload: {
    storeName?: string;
    trackInventory?: boolean;
    posSugarChoiceEnabled?: boolean;
    posIceChoiceEnabled?: boolean;
    sugarLevels?: number[];
    iceLevels?: number[];
    taxCode?: string;
    invoiceTemplate?: string;
    invoiceSerial?: string;
    vatRate?: number;
    address?: string;
    phone?: string;
  }): Promise<{ tenant: Record<string, unknown> }> {
    return apiRequest<{ tenant: Record<string, unknown> }>('/auth/tenant', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },
};

export const UserController = {
  async createEmployee(payload: CreateEmployeePayload): Promise<User> {
    return apiRequest<User>('/users', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async getEmployees(): Promise<User[]> {
    return apiRequest<User[]>('/users', { auth: true });
  },
};
