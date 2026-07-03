/** Mức % mặc định — quán có thể đổi trong Cài đặt → Định lượng */
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

export function resolveSugarLevels(settings?: { sugarLevels?: number[] } | null): number[] {
  return normalizePercentLevels(settings?.sugarLevels, DEFAULT_SUGAR_LEVELS);
}

export function resolveIceLevels(settings?: { iceLevels?: number[] } | null): number[] {
  return normalizePercentLevels(settings?.iceLevels, DEFAULT_ICE_LEVELS);
}
