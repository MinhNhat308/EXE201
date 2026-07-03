import { ShiftSessionRecord } from '@/controllers/shift.controller';
import { Role } from '@/models/user.model';
import { StaffSession, WorkRole, WorkShift } from '@/models/staff.model';

export function staffSessionFromRecord(record: ShiftSessionRecord): StaffSession {
  return {
    sessionId: record.id,
    workShift: record.workShift as WorkShift,
    workRole: record.workRole as WorkRole | undefined,
    checkedInRole: record.role as Role,
    startedAt: record.startedAt,
    branchId: record.branchId,
  };
}

export function buildCheckInPayload(session: StaffSession) {
  return {
    workShift: session.workShift,
    workRole: session.workRole,
  };
}
