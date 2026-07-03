import { SaasFeature } from '@/models/saas-feature.model';

/** Khớp prefix dài nhất — dùng chặn route & lọc menu */
const ROUTE_FEATURES: { prefix: string; feature: SaasFeature }[] = [
  { prefix: '/dashboard/kitchen', feature: SaasFeature.KITCHEN },
  { prefix: '/dashboard/manager', feature: SaasFeature.SHIFT_MGMT },
  { prefix: '/dashboard/warehouse', feature: SaasFeature.WAREHOUSE },
  { prefix: '/dashboard/accounting', feature: SaasFeature.ACCOUNTING },
  { prefix: '/dashboard/admin/employees', feature: SaasFeature.EMPLOYEES },
  { prefix: '/dashboard/admin/recipes', feature: SaasFeature.RECIPE },
  { prefix: '/dashboard/admin/ledger', feature: SaasFeature.ACCOUNTING },
  { prefix: '/dashboard/admin/supplier', feature: SaasFeature.ACCOUNTING },
  { prefix: '/dashboard/admin/stock-requests', feature: SaasFeature.ACCOUNTING },
  { prefix: '/dashboard/admin/warehouses', feature: SaasFeature.WAREHOUSE },
  { prefix: '/dashboard/admin/ingredients', feature: SaasFeature.WAREHOUSE },
  { prefix: '/dashboard/admin/min-stock', feature: SaasFeature.WAREHOUSE },
  { prefix: '/dashboard/admin/stock', feature: SaasFeature.WAREHOUSE },
  { prefix: '/dashboard/admin/payments', feature: SaasFeature.PAYMENTS },
  { prefix: '/dashboard/admin/toppings', feature: SaasFeature.MENU },
  { prefix: '/dashboard/admin/menu', feature: SaasFeature.MENU },
  { prefix: '/dashboard/admin/reports', feature: SaasFeature.BASIC_REPORTS },
  { prefix: '/dashboard/admin/branches', feature: SaasFeature.MULTI_BRANCH },
  { prefix: '/dashboard/admin/chain-reports', feature: SaasFeature.MULTI_BRANCH },
  { prefix: '/dashboard/manager/reports', feature: SaasFeature.BASIC_REPORTS },
  { prefix: '/dashboard/accounting/reports', feature: SaasFeature.BASIC_REPORTS },
  { prefix: '/dashboard/shifts', feature: SaasFeature.SHIFT_MGMT },
  { prefix: '/dashboard/check-in', feature: SaasFeature.SHIFT_MGMT },
  { prefix: '/dashboard/staff/setup', feature: SaasFeature.SHIFT_MGMT },
  { prefix: '/dashboard/staff', feature: SaasFeature.POS },
];

export function getRequiredFeatureForPath(pathname: string): SaasFeature | null {
  const sorted = [...ROUTE_FEATURES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { prefix, feature } of sorted) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return feature;
    }
  }
  return null;
}
