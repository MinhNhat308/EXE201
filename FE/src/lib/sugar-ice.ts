import { TenantInfo } from '@/models/tenant.model';

/** Mức % mặc định khi quán chưa cấu hình */
export const DEFAULT_SUGAR_LEVELS = [0, 25, 50, 75, 100];
export const DEFAULT_ICE_LEVELS = [0, 25, 50, 75, 100];

export function normalizePercentLevels(
  raw: number[] | undefined | null,
  fallback: number[] = DEFAULT_SUGAR_LEVELS,
): number[] {
  if (!raw?.length) return [...fallback];
  const unique = [
    ...new Set(
      raw
        .map((n) => Math.round(Number(n)))
        .filter((n) => Number.isFinite(n) && n >= 0 && n <= 100),
    ),
  ].sort((a, b) => a - b);
  return unique.length > 0 ? unique : [...fallback];
}

export function resolveSugarLevels(tenant?: TenantInfo | null): number[] {
  return normalizePercentLevels(tenant?.settings?.sugarLevels, DEFAULT_SUGAR_LEVELS);
}

export function resolveIceLevels(tenant?: TenantInfo | null): number[] {
  return normalizePercentLevels(tenant?.settings?.iceLevels, DEFAULT_ICE_LEVELS);
}

/** Mặc định khi mở modal = mức cao nhất quán cấu hình (thường 100%) */
export function defaultLevelFromPresets(levels: number[]): number {
  if (!levels.length) return 100;
  return levels[levels.length - 1];
}

export function sugarChoiceLabel(p: number): string {
  if (p === 0) return 'Không đường';
  if (p <= 30) return 'Ít đường';
  if (p <= 50) return 'Vừa';
  if (p <= 70) return 'Ngọt';
  return 'Rất ngọt';
}

export function iceChoiceLabel(p: number): string {
  if (p === 0) return 'Không đá';
  if (p <= 30) return 'Ít đá';
  if (p <= 50) return 'Vừa';
  if (p <= 70) return 'Nhiều đá';
  return 'Đặc';
}

export function formatSugarIceLine(sugar?: number, ice?: number): string {
  const parts: string[] = [];
  if (sugar != null) parts.push(`Đường ${sugar}%`);
  if (ice != null) parts.push(`Đá ${ice}%`);
  return parts.join(' · ');
}

export function posSugarIceEnabled(tenant?: TenantInfo | null): {
  sugar: boolean;
  ice: boolean;
  any: boolean;
} {
  if (tenant?.settings?.trackInventory === false) {
    return { sugar: false, ice: false, any: false };
  }
  const sugar = tenant?.settings?.posSugarChoiceEnabled !== false;
  const ice = tenant?.settings?.posIceChoiceEnabled !== false;
  return { sugar, ice, any: sugar || ice };
}
