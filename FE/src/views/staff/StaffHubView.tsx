'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-storage';
import { getStaffSession } from '@/lib/staff-session-storage';
import {
  getPrimaryWorkspacePath,
  getWorkPathAfterCheckIn,
  STORE_CHECK_IN_PATH,
} from '@/lib/workspace-routes';
import { Role } from '@/models/user.model';

export function StaffHubView() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser<{ role: Role }>();
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== Role.STAFF) {
      router.replace(getPrimaryWorkspacePath(user.role));
      return;
    }

    const session = getStaffSession();
    if (!session || session.checkedInRole !== Role.STAFF) {
      router.replace(STORE_CHECK_IN_PATH);
      return;
    }

    router.replace(getWorkPathAfterCheckIn(Role.STAFF, session.workRole));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-stone-500">
      Đang chuyển hướng...
    </div>
  );
}
