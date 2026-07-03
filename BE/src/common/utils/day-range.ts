const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** YYYY-MM-DD theo múi giờ cửa hàng */
export function calendarDateInTimezone(
  timeZone = DEFAULT_TIMEZONE,
  ref = new Date(),
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ref);
}

/** UTC instant của 00:00:00 một ngày lịch trong timeZone */
function zonedMidnightUtc(ymd: string, timeZone: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  // Thử các mốc UTC quanh ngày lịch — đủ cho mọi offset hợp lệ
  for (let hour = -14; hour <= 14; hour++) {
    const probe = new Date(Date.UTC(y, m - 1, d, hour, 0, 0, 0));
    if (calendarDateInTimezone(timeZone, probe) === ymd) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }).formatToParts(probe);
      const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
      const min = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
      const sec = Number(parts.find((p) => p.type === 'second')?.value ?? 0);
      if (h === 0 && min === 0 && sec === 0) return probe;
      return new Date(probe.getTime() - ((h * 3600 + min * 60 + sec) * 1000));
    }
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function nextCalendarDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

/** Khoảng [start, end) của "hôm nay" theo múi giờ cửa hàng — tránh lệch UTC trên cloud */
export function getDayRangeInTimezone(
  timeZone = DEFAULT_TIMEZONE,
  ref = new Date(),
): { start: Date; end: Date } {
  const ymd = calendarDateInTimezone(timeZone, ref);
  const start = zonedMidnightUtc(ymd, timeZone);
  const end = zonedMidnightUtc(nextCalendarDate(ymd), timeZone);
  return { start, end };
}

export function formatDatePrefixInTimezone(
  timeZone = DEFAULT_TIMEZONE,
  ref = new Date(),
): string {
  const ymd = calendarDateInTimezone(timeZone, ref);
  return ymd.replace(/-/g, '').slice(2);
}
