import { getStoredPlan, getStoredSubscription } from '@/lib/auth-storage';
import { getStaffSession } from '@/lib/staff-session-storage';
import { WorkRole } from '@/models/staff.model';
import { SubscriptionPlan, TenantInfo } from '@/models/tenant.model';
import { DASHBOARD_ROUTES, Role } from '@/models/user.model';

export const SOLO_HUB_PATH = '/dashboard/solo';
export const SOLO_POS_PATH = '/dashboard/solo/pos';
export const SOLO_SALES_PATH = '/dashboard/solo/sales';
export const SOLO_SETTINGS_PATH = '/dashboard/solo/settings';

export const STORE_CHECK_IN_PATH = '/dashboard/check-in';
export const STORE_STAFF_HUB_PATH = '/dashboard/staff/hub';
export const STORE_CASHIER_POS_PATH = '/dashboard/staff/cashier';
export const STORE_CASHIER_ORDERS_PATH = '/dashboard/staff/cashier/orders';
export const STORE_SERVER_PATH = '/dashboard/staff/server';
export const STORE_KITCHEN_ORDERS_PATH = '/dashboard/kitchen/orders';
export const STORE_MANAGER_SHIFTS_PATH = '/dashboard/manager/shifts';
export const STORE_ACCOUNTING_SHIFTS_PATH = '/dashboard/accounting/shifts';
export const STORE_SETTINGS_PATH = '/dashboard/admin/store-settings';
export const STORE_REPORTS_PATH = '/dashboard/admin/reports';
export const STORE_MANAGER_REPORTS_PATH = '/dashboard/manager/reports';
export const STORE_ACCOUNTING_REPORTS_PATH = '/dashboard/accounting/reports';

export const POS_PATH = STORE_CASHIER_POS_PATH;
export const ADMIN_PATH = '/dashboard/admin';

export function resolveOperatingPlan(
  tenant?: TenantInfo | null,
  plan?: string | null,
): SubscriptionPlan {
  if (tenant?.intendedPlan) {
    return tenant.intendedPlan;
  }

  const pl =
    plan ??
    getStoredPlan() ??
    getStoredSubscription<{ plan?: string }>()?.plan ??
    SubscriptionPlan.STANDARD;

  if (pl === SubscriptionPlan.SOLO || pl === 'SOLO') return SubscriptionPlan.SOLO;
  if (pl === SubscriptionPlan.PREMIUM || pl === 'PREMIUM') return SubscriptionPlan.PREMIUM;
  return SubscriptionPlan.STANDARD;
}

export function isSoloOperatingPlan(
  tenant?: TenantInfo | null,
  plan?: string,
): boolean {
  return resolveOperatingPlan(tenant, plan) === SubscriptionPlan.SOLO;
}

export function isStoreOperatingPlan(
  tenant?: TenantInfo | null,
  plan?: string,
): boolean {
  return resolveOperatingPlan(tenant, plan) === SubscriptionPlan.STANDARD;
}

export function isChainOperatingPlan(
  tenant?: TenantInfo | null,
  plan?: string,
): boolean {
  return resolveOperatingPlan(tenant, plan) === SubscriptionPlan.PREMIUM;
}

/** STAFF + Bếp phải check-in ca trước khi làm việc */
export function needsShiftCheckIn(role: Role): boolean {
  return role === Role.STAFF || role === Role.KITCHEN;
}

/** Màn làm việc sau khi đã check-in ca */
export function getWorkPathAfterCheckIn(role: Role, workRole?: WorkRole): string {
  if (role === Role.STAFF) {
    if (workRole === WorkRole.SERVER) return STORE_SERVER_PATH;
    return STORE_CASHIER_ORDERS_PATH;
  }
  if (role === Role.KITCHEN) return STORE_KITCHEN_ORDERS_PATH;
  return DASHBOARD_ROUTES[role] ?? ADMIN_PATH;
}

function resolveStaffWorkPath(session: ReturnType<typeof getStaffSession>): string {
  if (!session) return STORE_CHECK_IN_PATH;
  return getWorkPathAfterCheckIn(session.checkedInRole, session.workRole);
}

/** Hub/dashboard theo role (Store/Chain) */
export function getRoleHubPath(role: Role): string {
  switch (role) {
    case Role.STAFF:
      return STORE_CASHIER_ORDERS_PATH;
    case Role.KITCHEN:
      return STORE_KITCHEN_ORDERS_PATH;
    case Role.STORE_MANAGER:
      return DASHBOARD_ROUTES[Role.STORE_MANAGER];
    case Role.ACCOUNTING:
      return DASHBOARD_ROUTES[Role.ACCOUNTING];
    case Role.WAREHOUSE:
      return DASHBOARD_ROUTES[Role.WAREHOUSE];
    case Role.ADMIN:
      return ADMIN_PATH;
    default:
      return ADMIN_PATH;
  }
}

/** Màn hình mặc định sau đăng nhập */
export function getPrimaryWorkspacePath(
  role: Role,
  tenant?: TenantInfo | null,
  plan?: string,
): string {
  if (role === Role.ADMIN && isSoloOperatingPlan(tenant, plan)) {
    return SOLO_HUB_PATH;
  }

  if (role === Role.ADMIN) {
    return ADMIN_PATH;
  }

  if (needsShiftCheckIn(role)) {
    const session = getStaffSession();
    if (!session || session.checkedInRole !== role) {
      return STORE_CHECK_IN_PATH;
    }
    return resolveStaffWorkPath(session);
  }

  return getRoleHubPath(role);
}
