import { BusinessModel } from '../enums/business-model.enum';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

/** Gói đăng ký → quy mô chi nhánh (nội bộ) */
export function businessModelFromPlan(plan: SubscriptionPlan): BusinessModel {
  return plan === SubscriptionPlan.PREMIUM
    ? BusinessModel.LARGE
    : BusinessModel.SMALL;
}

export const SEGMENT_SLUG: Record<SubscriptionPlan, 'solo' | 'store' | 'chain'> = {
  [SubscriptionPlan.SOLO]: 'solo',
  [SubscriptionPlan.STANDARD]: 'store',
  [SubscriptionPlan.PREMIUM]: 'chain',
};
