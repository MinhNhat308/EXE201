import { SubscriptionPlan } from '@/models/tenant.model';

export type SegmentSlug = 'solo' | 'store' | 'chain';

export interface SegmentOption {
  plan: SubscriptionPlan;
  slug: SegmentSlug;
  name: string;
  shortName: string;
  tagline: string;
  priceLabel: string;
  employees: string;
  branches: string;
  emoji: string;
  accent: string;
  border: string;
  popular?: boolean;
}

/** Một hệ thống tên duy nhất: Solo · Store · Chain */
export const SEGMENTS: SegmentOption[] = [
  {
    plan: SubscriptionPlan.SOLO,
    slug: 'solo',
    name: 'BOBAPOS Solo',
    shortName: 'Solo',
    tagline: 'Một mình vận hành · 1 chi nhánh',
    priceLabel: '99k/tháng',
    employees: '1 người',
    branches: '1 chi nhánh',
    emoji: '☕',
    accent: 'from-sky-100 via-blue-50 to-white',
    border: 'border-sky-200',
    popular: true,
  },
  {
    plan: SubscriptionPlan.STANDARD,
    slug: 'store',
    name: 'BOBAPOS Store',
    shortName: 'Store',
    tagline: 'Cửa hàng có nhân viên · 1 chi nhánh',
    priceLabel: '299k/tháng',
    employees: 'đến 10 nhân viên',
    branches: '1 chi nhánh',
    emoji: '🏪',
    accent: 'from-emerald-100 via-teal-50 to-white',
    border: 'border-emerald-200',
  },
  {
    plan: SubscriptionPlan.PREMIUM,
    slug: 'chain',
    name: 'BOBAPOS Chain',
    shortName: 'Chain',
    tagline: 'Chuỗi cửa hàng · đa chi nhánh',
    priceLabel: '599k/tháng',
    employees: 'không giới hạn',
    branches: 'đa chi nhánh',
    emoji: '🏢',
    accent: 'from-violet-100 via-fuchsia-50 to-white',
    border: 'border-violet-200',
  },
];

export const SEGMENT_BY_PLAN = Object.fromEntries(
  SEGMENTS.map((s) => [s.plan, s]),
) as Record<SubscriptionPlan, SegmentOption>;

export const SEGMENT_BY_SLUG = Object.fromEntries(
  SEGMENTS.map((s) => [s.slug, s]),
) as Record<SegmentSlug, SegmentOption>;

export function parsePlanParam(value: string | null): SubscriptionPlan | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === SubscriptionPlan.SOLO) return SubscriptionPlan.SOLO;
  if (upper === SubscriptionPlan.STANDARD) return SubscriptionPlan.STANDARD;
  if (upper === SubscriptionPlan.PREMIUM) return SubscriptionPlan.PREMIUM;
  const bySlug = SEGMENT_BY_SLUG[value.toLowerCase() as SegmentSlug];
  return bySlug?.plan ?? null;
}

export function segmentLabel(plan: SubscriptionPlan): string {
  return SEGMENT_BY_PLAN[plan]?.name ?? plan;
}

export function segmentShortLabel(plan: SubscriptionPlan): string {
  return SEGMENT_BY_PLAN[plan]?.shortName ?? plan;
}
