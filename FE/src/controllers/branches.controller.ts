import { apiRequest } from '@/lib/api';
import type { Branch, BranchSummary } from '@/models/branch.model';

export const BranchesController = {
  list(skipCache = false): Promise<Branch[]> {
    return apiRequest<Branch[]>('/branches', {
      auth: true,
      cacheTtlMs: 60_000,
      skipCache,
    });
  },

  summary(): Promise<BranchSummary> {
    return apiRequest<BranchSummary>('/branches/summary', { auth: true, cacheTtlMs: 60_000 });
  },

  create(payload: {
    code: string;
    name: string;
    address?: string;
    isDefault?: boolean;
  }): Promise<Branch> {
    return apiRequest<Branch>('/branches', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(
    id: string,
    payload: Partial<{ name: string; address: string; isActive: boolean; isDefault: boolean }>,
  ): Promise<Branch> {
    return apiRequest<Branch>(`/branches/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },
};
