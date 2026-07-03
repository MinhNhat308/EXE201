import { Role } from '@/models/user.model';

export enum WorkShift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export enum WorkRole {
  CASHIER = 'CASHIER',
  SERVER = 'SERVER',
}

export const WORK_SHIFT_LABELS: Record<WorkShift, string> = {
  [WorkShift.MORNING]: 'Ca sáng',
  [WorkShift.AFTERNOON]: 'Ca trưa',
  [WorkShift.EVENING]: 'Ca chiều',
  [WorkShift.NIGHT]: 'Ca tối',
};

export const WORK_SHIFT_HOURS: Record<WorkShift, string> = {
  [WorkShift.MORNING]: '7h - 12h',
  [WorkShift.AFTERNOON]: '12h - 17h',
  [WorkShift.EVENING]: '17h - 21h',
  [WorkShift.NIGHT]: '21h - 23h',
};

export const WORK_ROLE_LABELS: Record<WorkRole, string> = {
  [WorkRole.CASHIER]: 'Thu ngân',
  [WorkRole.SERVER]: 'Phục vụ / Bồi bàn',
};

export interface StaffSession {
  /** ID ca trên server (Store) */
  sessionId?: string;
  workShift: WorkShift;
  /** Chỉ STAFF — Thu ngân hoặc Phục vụ */
  workRole?: WorkRole;
  /** Role đăng nhập lúc check-in */
  checkedInRole: Role;
  startedAt: string;
  branchId?: string;
}

export const STAFF_ROUTES: Record<WorkRole, string> = {
  [WorkRole.CASHIER]: '/dashboard/staff/cashier/orders',
  [WorkRole.SERVER]: '/dashboard/staff/server',
};
