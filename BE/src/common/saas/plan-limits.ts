import { SubscriptionPlan } from '../enums/subscription-plan.enum';

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { maxEmployees: number; maxBranches: number }
> = {
  [SubscriptionPlan.SOLO]: { maxEmployees: 1, maxBranches: 1 },
  [SubscriptionPlan.STANDARD]: { maxEmployees: 10, maxBranches: 1 },
  [SubscriptionPlan.PREMIUM]: { maxEmployees: 9999, maxBranches: 9999 },
};

export const TRIAL_DAYS = 7;

/** Mỗi lần thanh toán gói (99k / 299k / 599k) = tối đa 30 ngày sử dụng */
export const SUBSCRIPTION_PERIOD_DAYS = 30;

/** Thời gian tối đa chờ CK / QR cho một hóa đơn billing (phút) */
export const BILLING_PAYMENT_TIMEOUT_MINUTES = 10;

export const PLAN_PRICING_VND: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.SOLO]: 99_000,
  [SubscriptionPlan.STANDARD]: 299_000,
  [SubscriptionPlan.PREMIUM]: 599_000,
};

/** Gói demo theo slug — thuyết trình phân khúc (ACTIVE, không trial full) */
export const DEMO_PLAN_BY_SLUG: Record<string, SubscriptionPlan> = {
  'demo-solo': SubscriptionPlan.SOLO,
  'demo-store': SubscriptionPlan.STANDARD,
  'demo-chain': SubscriptionPlan.PREMIUM,
};
