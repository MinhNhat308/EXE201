/** Map BOBAPOS enums → Admin portal display values */

export type AdminTenantStatus = 'active' | 'inactive' | 'pending' | 'suspended';

const PLAN_TO_ADMIN: Record<string, string> = {
  SOLO: 'solo',
  STANDARD: 'standard',
  PREMIUM: 'premium',
};

const PLAN_LABELS: Record<string, string> = {
  SOLO: 'Solo',
  STANDARD: 'Store',
  PREMIUM: 'Chain',
};

const PLAN_PRICING_VND: Record<string, number> = {
  SOLO: 99_000,
  STANDARD: 299_000,
  PREMIUM: 599_000,
};

export function mapBobaposPlanToAdmin(plan?: string): string {
  if (!plan) return 'standard';
  return PLAN_TO_ADMIN[plan.toUpperCase()] ?? plan.toLowerCase();
}

export function mapAdminPlanToBobapos(plan?: string): string {
  const p = (plan ?? '').toLowerCase();
  if (p === 'solo' || p === 'starter') return 'SOLO';
  if (p === 'standard' || p === 'store') return 'STANDARD';
  if (p === 'premium' || p === 'chain' || p === 'enterprise') return 'PREMIUM';
  return 'STANDARD';
}

export function planLabel(plan?: string): string {
  if (!plan) return 'Store';
  return PLAN_LABELS[plan.toUpperCase()] ?? plan;
}

export function planPriceVnd(plan?: string): number {
  if (!plan) return PLAN_PRICING_VND.STANDARD;
  return PLAN_PRICING_VND[plan.toUpperCase()] ?? 0;
}

export function mapBobaposTenantStatus(status?: string): AdminTenantStatus {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'EXPIRED':
      return 'inactive';
    case 'SUSPENDED':
      return 'suspended';
    case 'TRIAL':
    default:
      return 'pending';
  }
}

export function mapBobaposInvoiceStatus(status?: string): string {
  switch ((status ?? '').toUpperCase()) {
    case 'PAID':
      return 'active';
    case 'PENDING':
      return 'pending';
    case 'FAILED':
      return 'cancelled';
    case 'REFUNDED':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function mapBobaposRoleToEmployeeRole(role?: string): string {
  switch ((role ?? '').toUpperCase()) {
    case 'STORE_MANAGER':
      return 'manager';
    case 'ACCOUNTING':
      return 'accounting';
    case 'WAREHOUSE':
      return 'warehouse';
    case 'KITCHEN':
      return 'kitchen';
    case 'STAFF':
    default:
      return 'staff';
  }
}

export const BOBAPOS_PLAN_DEFINITIONS = [
  {
    name: 'Solo',
    value: 'solo',
    price: '99.000₫/tháng',
    description: '1 người vận hành — POS + hóa đơn, phù hợp quán nhỏ.',
    status: 'active',
    features: ['1 nhân viên', '1 chi nhánh', 'POS Solo', 'Báo cáo bán hàng'],
  },
  {
    name: 'Store',
    value: 'standard',
    price: '299.000₫/tháng',
    description: '1 cửa hàng có nhân viên — POS, bếp, kho, kế toán.',
    status: 'active',
    features: ['10 nhân viên', '1 chi nhánh', 'KDS bếp', 'Quản lý kho & ca'],
  },
  {
    name: 'Chain',
    value: 'premium',
    price: '599.000₫/tháng',
    description: 'Chuỗi đa chi nhánh — báo cáo tổng hợp & phân quyền theo CN.',
    status: 'active',
    features: ['Không giới hạn NV/CN', 'Báo cáo chuỗi', 'Chuyển kho liên CN', 'Premium SLA'],
  },
];
