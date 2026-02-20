import type { BarData } from '../core/types';

/** Normalize various OHLCV formats to internal BarData */
export function normalizeBarData(data: unknown[]): BarData[] {
  if (data.length === 0) return [];

  const first = data[0];

  // Array format: [time, open, high, low, close, volume?]
  if (Array.isArray(first)) {
    return data.map((row) => {
      const r = row as number[];
      return {
        time: r[0],
        open: r[1],
        high: r[2],
        low: r[3],
        close: r[4],
        volume: r[5] ?? 0,
      };
    });
  }

  // Object format (various key names)
  if (typeof first === 'object' && first !== null) {
    return data.map((item) => {
      const r = item as Record<string, unknown>;
      return {
        time: toNum(r.time ?? r.t ?? r.date ?? r.timestamp ?? 0),
        open: toNum(r.open ?? r.o ?? 0),
        high: toNum(r.high ?? r.h ?? 0),
        low: toNum(r.low ?? r.l ?? 0),
        close: toNum(r.close ?? r.c ?? 0),
        volume: toNum(r.volume ?? r.vol ?? r.v ?? 0),
      };
    });
  }

  return [];
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // Date string → Unix timestamp
    if (v.includes('-') || v.includes('/')) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? 0 : d.getTime() / 1000;
    }
    return parseFloat(v) || 0;
  }
  return 0;
}
