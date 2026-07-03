'use client';

import { useCallback, useState } from 'react';
import {
  getStaffSession,
  syncStaffSessionFromServer,
} from '@/lib/staff-session-storage';
import { StaffSession } from '@/models/staff.model';

/** Session ca — 1 lần mount, tránh object mới mỗi render gây loop useEffect */
export function useStableStaffSession() {
  const [session, setSession] = useState<StaffSession | null>(() => getStaffSession());

  const refresh = useCallback(async () => {
    const synced = await syncStaffSessionFromServer();
    setSession(synced);
    return synced;
  }, []);

  return { session, setSession, refresh };
}

/** Khóa primitive ổn định cho dependency arrays */
export function staffSessionKey(session: StaffSession | null | undefined): string {
  if (!session) return '';
  return [
    session.sessionId ?? '',
    session.workShift,
    session.workRole ?? '',
    session.checkedInRole,
  ].join(':');
}
