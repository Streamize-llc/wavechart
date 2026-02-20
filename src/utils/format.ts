/** Auto-detect decimal places from price values */
export function detectPrecision(values: number[]): number {
  let maxDecimals = 0;
  for (const v of values) {
    if (!isFinite(v)) continue;
    const str = v.toString();
    const dot = str.indexOf('.');
    if (dot >= 0) {
      maxDecimals = Math.max(maxDecimals, str.length - dot - 1);
    }
  }
  return Math.min(maxDecimals, 8);
}

/** Format a price with given precision */
export function formatPrice(price: number, precision: number): string {
  return price.toFixed(precision);
}

/** Time label weight: higher = more important */
export const enum TimeWeight {
  Minute = 0,
  Hour = 1,
  Day = 2,
  Month = 3,
  Year = 4,
}

/** Format timestamp for time axis based on weight */
export function formatTime(timestamp: number, weight: TimeWeight): string {
  const d = new Date(timestamp * 1000);

  switch (weight) {
    case TimeWeight.Year:
      return d.getUTCFullYear().toString();
    case TimeWeight.Month:
      return MONTHS[d.getUTCMonth()];
    case TimeWeight.Day:
      return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
    case TimeWeight.Hour:
      return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
    case TimeWeight.Minute:
      return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  }
}

/** Compute time weight for a given timestamp relative to previous */
export function computeTimeWeight(timestamp: number, prevTimestamp: number | null): TimeWeight {
  const d = new Date(timestamp * 1000);
  const prev = prevTimestamp !== null ? new Date(prevTimestamp * 1000) : null;

  if (!prev || d.getUTCFullYear() !== prev.getUTCFullYear()) return TimeWeight.Year;
  if (d.getUTCMonth() !== prev.getUTCMonth()) return TimeWeight.Month;
  if (d.getUTCDate() !== prev.getUTCDate()) return TimeWeight.Day;
  if (d.getUTCHours() !== prev.getUTCHours()) return TimeWeight.Hour;
  return TimeWeight.Minute;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_SHORT = MONTHS;

function pad2(n: number): string {
  return n < 10 ? '0' + n : n.toString();
}
