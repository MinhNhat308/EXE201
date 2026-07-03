import { apiRequest } from '@/lib/api';
import { AuthResponse } from '@/models/user.model';
import { SubscriptionPlan } from '@/models/tenant.model';

export const PublicController = {
  getPlans() {
    return apiRequest<{
      trialDays: number;
      plans: Array<{
        id: string;
        name: string;
        priceMonthly: number;
        maxEmployees: number;
        maxBranches: number;
        features: string[];
      }>;
    }>('/public/plans');
  },

  register(payload: {
    storeName: string;
    intendedPlan: SubscriptionPlan;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return apiRequest<AuthResponse>('/public/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
