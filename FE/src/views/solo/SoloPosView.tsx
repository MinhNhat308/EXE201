'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredTenant, getStoredUser } from '@/lib/auth-storage';
import { isSoloOperatingPlan } from '@/lib/workspace-routes';
import { Role, User } from '@/models/user.model';
import { CashierView } from '@/views/staff/CashierView';
import { TenantInfo } from '@/models/tenant.model';

export function SoloPosView() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser<User>();
    const tenant = getStoredTenant<TenantInfo>();
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/login');
      return;
    }
    if (!isSoloOperatingPlan(tenant)) {
      router.replace('/dashboard/staff/cashier');
    }
  }, [router]);

  return <CashierView solo />;
}
