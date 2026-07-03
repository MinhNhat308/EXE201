'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredTenant } from '@/lib/auth-storage';
import { needsOnboarding } from '@/lib/onboarding';
import type { TenantInfo } from '@/models/tenant.model';

/** Chủ cửa hàng chưa hoàn tất wizard → /dashboard/onboarding */
export function OnboardingRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/dashboard/onboarding')) return;
    const tenant = getStoredTenant<TenantInfo>();
    if (needsOnboarding(tenant)) {
      router.replace('/dashboard/onboarding');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
