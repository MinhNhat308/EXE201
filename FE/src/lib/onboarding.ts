import {
  getPrimaryWorkspacePath,
} from '@/lib/workspace-routes';
import type { TenantInfo } from '@/models/tenant.model';
import { SubscriptionPlan } from '@/models/tenant.model';
import { Role } from '@/models/user.model';

/** Tenant demo thuyết trình */
const SKIP_ONBOARDING_SLUGS = new Set([
  'demo-solo',
  'demo-store',
  'demo-chain',
  'teaflow-legacy',
]);

export function needsOnboarding(tenant: TenantInfo | null | undefined): boolean {
  if (!tenant?.id) return false;
  if (SKIP_ONBOARDING_SLUGS.has(tenant.slug)) return false;
  if (tenant.intendedPlan === SubscriptionPlan.SOLO) return false;
  const completed = tenant.settings?.onboardingCompletedAt;
  return !completed;
}

export function getPostLoginPath(
  role: Role,
  tenant?: TenantInfo | null,
  plan?: string,
): string {
  return getPrimaryWorkspacePath(role, tenant, plan);
}
