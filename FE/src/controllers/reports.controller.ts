import { apiRequest } from '@/lib/api';
import type { StoreReportBundle } from '@/models/store-report.model';
import { WorkShift } from '@/models/staff.model';

export const ReportsController = {
  getStoreBundle(
    date?: string,
    workShift?: WorkShift,
    branchId?: string,
  ): Promise<StoreReportBundle> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (workShift) params.set('workShift', workShift);
    if (branchId) params.set('branchId', branchId);
    const q = params.toString() ? `?${params}` : '';
    return apiRequest<StoreReportBundle>(`/reports/store${q}`, {
      auth: true,
      cacheTtlMs: 15_000,
      signal: AbortSignal.timeout(45_000),
    });
  },

  getChainBundle(date?: string, workShift?: WorkShift) {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (workShift) params.set('workShift', workShift);
    const q = params.toString() ? `?${params}` : '';
    return apiRequest<import('@/models/branch.model').ChainReportBundle>(
      `/reports/chain${q}`,
      { auth: true, cacheTtlMs: 15_000, signal: AbortSignal.timeout(45_000) },
    );
  },
};
