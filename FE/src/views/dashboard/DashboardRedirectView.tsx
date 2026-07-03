'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { hydrateAuthFromServer } from '@/lib/auth-hydrate';
import {
  getStoredPlan,
  getStoredTenant,
  getStoredUser,
} from '@/lib/auth-storage';
import { getPostLoginPath } from '@/lib/onboarding';
import type { TenantInfo } from '@/models/tenant.model';
import { Role, User } from '@/models/user.model';

/** Điều hướng đúng workspace sau login (Solo Hub / POS / Admin) */
export function DashboardRedirectView() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let user = getStoredUser<User>();
      if (!user) {
        user = await hydrateAuthFromServer();
      }
      if (cancelled) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      const tenant = getStoredTenant<TenantInfo>();
      router.replace(
        getPostLoginPath(
          user.role as Role,
          tenant,
          getStoredPlan() ?? undefined,
        ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className={`flex min-h-screen items-center justify-center ${BRAND.pageBg}`}>
      <div className={`h-11 w-11 animate-spin rounded-full border-4 ${BRAND.spinner}`} />
    </div>
  );
}
