import { apiRequest } from '@/lib/api';
import { Role } from '@/models/user.model';
import { WorkRole, WorkShift } from '@/models/staff.model';

export type ShiftSessionRecord = {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  role: Role;
  workRole?: WorkRole;
  workShift: WorkShift;
  startedAt: string;
  endedAt?: string;
  branchId?: string;
};

export const ShiftController = {
  checkIn(payload: { workShift: WorkShift; workRole?: WorkRole; branchId?: string }) {
    return apiRequest<ShiftSessionRecord>('/shifts/check-in', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  checkOut() {
    return apiRequest<ShiftSessionRecord>('/shifts/check-out', {
      method: 'POST',
      auth: true,
    });
  },

  getMyActive() {
    return apiRequest<ShiftSessionRecord | null>('/shifts/me', {
      auth: true,
      cacheTtlMs: 15_000,
    });
  },

  listToday(workShift?: WorkShift, activeOnly = false) {
    const params = new URLSearchParams();
    if (workShift) params.set('workShift', workShift);
    if (activeOnly) params.set('activeOnly', 'true');
    const q = params.toString() ? `?${params}` : '';
    return apiRequest<ShiftSessionRecord[]>(`/shifts/today${q}`, {
      auth: true,
      cacheTtlMs: 20_000,
    });
  },

  forceClose(sessionId: string) {
    return apiRequest<ShiftSessionRecord>(`/shifts/${sessionId}/close`, {
      method: 'PATCH',
      auth: true,
    });
  },
};
