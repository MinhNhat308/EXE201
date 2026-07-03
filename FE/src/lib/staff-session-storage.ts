import { ShiftController } from '@/controllers/shift.controller';
import { getStoredUser } from '@/lib/auth-storage';
import { isStoreOwner } from '@/lib/role-access';
import { staffSessionFromRecord } from '@/lib/shift-session-map';
import { Role } from '@/models/user.model';
import { StaffSession, WorkRole, WorkShift } from '@/models/staff.model';

const SESSION_KEY = 'staff_session';

function ownerDefaultSession(workRole: WorkRole): StaffSession {
  return {
    workShift: WorkShift.MORNING,
    workRole,
    checkedInRole: Role.STAFF,
    startedAt: new Date().toISOString(),
  };
}

export function saveStaffSession(session: StaffSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StaffSession;
    if (!parsed.workShift || !parsed.checkedInRole) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sessionMatchesRole(
  session: StaffSession | null,
  role: Role,
  workRole?: WorkRole,
): boolean {
  if (!session || session.checkedInRole !== role) return false;
  if (workRole && session.workRole !== workRole) return false;
  return true;
}

/**
 * Session ca làm. Chủ cửa hàng (ADMIN) tại POS có ca mặc định khi cần WorkRole.
 */
export function resolveStaffSession(requiredWorkRole?: WorkRole): StaffSession | null {
  const saved = getStaffSession();
  if (saved && (!requiredWorkRole || saved.workRole === requiredWorkRole)) {
    return saved;
  }

  const user = getStoredUser<{ role: Role }>();
  if (user && isStoreOwner(user.role) && requiredWorkRole) {
    return ownerDefaultSession(requiredWorkRole);
  }

  return saved;
}

export function clearStaffSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

/** Đồng bộ ca đang mở từ server (Store) */
export async function syncStaffSessionFromServer(): Promise<StaffSession | null> {
  const user = getStoredUser<{ role: Role }>();
  if (!user || isStoreOwner(user.role)) return getStaffSession();

  try {
    const remote = await ShiftController.getMyActive();
    if (!remote) {
      clearStaffSession();
      return null;
    }
    const session = staffSessionFromRecord(remote);
    saveStaffSession(session);
    return session;
  } catch {
    return getStaffSession();
  }
}

export async function endStaffSessionRemote() {
  const session = getStaffSession();
  if (session?.sessionId) {
    try {
      await ShiftController.checkOut();
    } catch {
      /* ignore */
    }
  }
  clearStaffSession();
}
