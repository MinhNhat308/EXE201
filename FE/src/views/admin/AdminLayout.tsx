'use client';

import { ReactNode, useMemo } from 'react';
import { getStoredPlan, getStoredTenant } from '@/lib/auth-storage';
import { CHAIN_OWNER_NAV_SECTIONS, OWNER_NAV_SECTIONS } from '@/lib/dashboard-nav';
import { isChainOperatingPlan } from '@/lib/workspace-routes';
import { Role } from '@/models/user.model';
import { TenantInfo } from '@/models/tenant.model';
import { AppShellLayout } from '@/views/components/AppShellLayout';
import { OnboardingRedirect } from '@/views/onboarding/OnboardingRedirect';

export function AdminLayout({ children }: { children: ReactNode }) {
  const tenant = getStoredTenant<TenantInfo>();
  const plan = getStoredPlan();
  const ownerNav = useMemo(
    () => (isChainOperatingPlan(tenant, plan ?? undefined) ? CHAIN_OWNER_NAV_SECTIONS : OWNER_NAV_SECTIONS),
    [tenant, plan],
  );

  return (
    <OnboardingRedirect>
      <AppShellLayout
        allowedRole={Role.ADMIN}
        roleBadge={isChainOperatingPlan(tenant, plan ?? undefined) ? 'Chủ chuỗi' : 'Chủ cửa hàng'}
        ownerNavSections={ownerNav}
        navSections={ownerNav}
      >
        {children}
      </AppShellLayout>
    </OnboardingRedirect>
  );
}
