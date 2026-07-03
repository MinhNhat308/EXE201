import { SubscriptionPlan, TenantInfo } from '@/models/tenant.model';
import { Role } from '@/models/user.model';
import { resolveOperatingPlan } from '@/lib/workspace-routes';
/** Role có thể gán khi chủ tạo nhân viên — theo gói */
export function getRegisterableRoles(
  plan?: SubscriptionPlan | string | null,
  tenant?: TenantInfo | null,
): Role[] {
  const op = resolveOperatingPlan(tenant, plan ?? null);

  if (op === SubscriptionPlan.SOLO) {
    return [];
  }

  if (op === SubscriptionPlan.STANDARD) {
    return [Role.STAFF, Role.KITCHEN, Role.STORE_MANAGER, Role.ACCOUNTING, Role.WAREHOUSE];
  }

  return [
    Role.STAFF,
    Role.KITCHEN,
    Role.STORE_MANAGER,
    Role.ACCOUNTING,
    Role.WAREHOUSE,
  ];
}

export const STORE_EMPLOYEE_ROLE_LABELS: Partial<Record<Role, string>> = {
  [Role.STAFF]: 'Thu ngân / Phục vụ (STAFF)',
  [Role.KITCHEN]: 'Bếp',
  [Role.STORE_MANAGER]: 'Quản lý ca',
  [Role.ACCOUNTING]: 'Kế toán',
  [Role.WAREHOUSE]: 'Thủ kho',
};
