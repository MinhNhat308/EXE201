'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hydrateAuthFromServer } from '@/lib/auth-hydrate';
import { getStoredUser } from '@/lib/auth-storage';
import { canAccessRole, isStoreOwner } from '@/lib/role-access';
import {
  resolveStaffSession,
  sessionMatchesRole,
  syncStaffSessionFromServer,
} from '@/lib/staff-session-storage';
import { needsShiftCheckIn, STORE_CHECK_IN_PATH } from '@/lib/workspace-routes';
import { WorkRole } from '@/models/staff.model';
import { Role, User } from '@/models/user.model';

/** Chặn màn làm việc nếu chưa check-in ca (Store STAFF/KITCHEN) */
export function useShiftGate(...allowedRoles: Role[]) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const rolesKey = allowedRoles.join(',');
  const gateStarted = useRef(false);

  useEffect(() => {
    if (gateStarted.current) return;
    gateStarted.current = true;

    void (async () => {
      let stored = getStoredUser<User>();
      if (!stored) {
        stored = await hydrateAuthFromServer();
      }
      if (!stored || !canAccessRole(stored.role, ...allowedRoles)) {
        router.replace('/login');
        return;
      }

      if (isStoreOwner(stored.role)) {
        setUser(stored);
        setReady(true);
        return;
      }

      if (needsShiftCheckIn(stored.role)) {
        const active = await syncStaffSessionFromServer();
        if (!sessionMatchesRole(active, stored.role)) {
          router.replace(STORE_CHECK_IN_PATH);
          return;
        }
        setUser(stored);
        setReady(true);
        return;
      }

      setUser(stored);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time gate; rolesKey stable
  }, [router, rolesKey]);

  return { ready, user, session: resolveStaffSession() };
}

export function useStaffWorkRoleGate(workRole: WorkRole) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState(() => resolveStaffSession(workRole));
  const gateStarted = useRef(false);

  useEffect(() => {
    if (gateStarted.current) return;
    gateStarted.current = true;

    void (async () => {
      let stored = getStoredUser<User>();
      if (!stored) {
        stored = await hydrateAuthFromServer();
      }
      if (!stored || !canAccessRole(stored.role, Role.STAFF)) {
        router.replace('/login');
        return;
      }

      if (isStoreOwner(stored.role)) {
        setUser(stored);
        setReady(true);
        return;
      }

      const active = await syncStaffSessionFromServer();
      if (!sessionMatchesRole(active, Role.STAFF, workRole)) {
        router.replace(STORE_CHECK_IN_PATH);
        return;
      }
      setSession(active);
      setUser(stored);
      setReady(true);
    })();
  }, [router, workRole]);

  return { ready, user, session };
}
