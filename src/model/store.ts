import type { BarData } from '../core/types';

/**
 * Columnar data store using Float64Arrays for performance.
 * 100K bars ≈ 5MB (vs ~50MB with object arrays).
 */
export class DataStore {
  private _time!: Float64Array;
  private _open!: Float64Array;
  private _high!: Float64Array;
  private _low!: Float64Array;
  private _close!: Float64Array;
  private _volume!: Float64Array;
  private _length = 0;
  private _capacity = 0;

  constructor() {
    this._allocate(0);
  }

  get length(): number {
    return this._length;
  }

  get time(): Float64Array {
    return this._time.subarray(0, this._length);
  }
  get open(): Float64Array {
    return this._open.subarray(0, this._length);
  }
  get high(): Float64Array {
    return this._high.subarray(0, this._length);
  }
  get low(): Float64Array {
    return this._low.subarray(0, this._length);
  }
  get close(): Float64Array {
    return this._close.subarray(0, this._length);
  }
  get volume(): Float64Array {
    return this._volume.subarray(0, this._length);
  }

  /** Replace all data */
  setData(bars: BarData[]): void {
    const n = bars.length;
    this._allocate(n);
    this._length = n;

    for (let i = 0; i < n; i++) {
      const bar = bars[i];
      this._time[i] = bar.time;
      this._open[i] = bar.open;
      this._high[i] = bar.high;
      this._low[i] = bar.low;
      this._close[i] = bar.close;
      this._volume[i] = bar.volume ?? 0;
    }
  }

  /** Append a new bar */
  appendBar(bar: BarData): void {
    if (this._length >= this._capacity) {
      this._grow();
    }
    const i = this._length;
    this._time[i] = bar.time;
    this._open[i] = bar.open;
    this._high[i] = bar.high;
    this._low[i] = bar.low;
    this._close[i] = bar.close;
    this._volume[i] = bar.volume ?? 0;
    this._length++;
  }

  /** Update the last bar */
  updateLastBar(bar: Partial<BarData>): void {
    if (this._length === 0) return;
    const i = this._length - 1;
    if (bar.time !== undefined) this._time[i] = bar.time;
    if (bar.open !== undefined) this._open[i] = bar.open;
    if (bar.high !== undefined) this._high[i] = bar.high;
    if (bar.low !== undefined) this._low[i] = bar.low;
    if (bar.close !== undefined) this._close[i] = bar.close;
    if (bar.volume !== undefined) this._volume[i] = bar.volume;
  }

  /** Get a single bar by index */
  getBar(index: number): BarData | null {
    if (index < 0 || index >= this._length) return null;
    return {
      time: this._time[index],
      open: this._open[index],
      high: this._high[index],
      low: this._low[index],
      close: this._close[index],
      volume: this._volume[index],
    };
  }

  /** Export all bars as plain objects (for API requests) */
  toArray(): BarData[] {
    const result: BarData[] = new Array(this._length);
    for (let i = 0; i < this._length; i++) {
      result[i] = {
        time: this._time[i],
        open: this._open[i],
        high: this._high[i],
        low: this._low[i],
        close: this._close[i],
        volume: this._volume[i],
      };
    }
    return result;
  }

  /** Get min/max high/low for a range of bars */
  getMinMax(from: number, to: number): { min: number; max: number } {
    const start = Math.max(0, from);
    const end = Math.min(this._length - 1, to);
    if (start > end) return { min: 0, max: 1 };

    let min = Infinity;
    let max = -Infinity;
    for (let i = start; i <= end; i++) {
      if (this._low[i] < min) min = this._low[i];
      if (this._high[i] > max) max = this._high[i];
    }

    if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 1 };
    return { min, max };
  }

  /** Get min/max of close values for a range */
  getCloseMinMax(from: number, to: number): { min: number; max: number } {
    const start = Math.max(0, from);
    const end = Math.min(this._length - 1, to);
    if (start > end) return { min: 0, max: 1 };

    let min = Infinity;
    let max = -Infinity;
    for (let i = start; i <= end; i++) {
      const v = this._close[i];
      if (isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }

    if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 1 };
    return { min, max };
  }

  /** Get max volume for a range */
  getMaxVolume(from: number, to: number): number {
    const start = Math.max(0, from);
    const end = Math.min(this._length - 1, to);
    let max = 0;
    for (let i = start; i <= end; i++) {
      if (this._volume[i] > max) max = this._volume[i];
    }
    return max;
  }

  private _allocate(size: number): void {
    this._capacity = Math.max(size, 256);
    this._time = new Float64Array(this._capacity);
    this._open = new Float64Array(this._capacity);
    this._high = new Float64Array(this._capacity);
    this._low = new Float64Array(this._capacity);
    this._close = new Float64Array(this._capacity);
    this._volume = new Float64Array(this._capacity);
  }

  private _grow(): void {
    const newCap = this._capacity * 2;
    const copy = (src: Float64Array) => {
      const dst = new Float64Array(newCap);
      dst.set(src);
      return dst;
    };
    this._time = copy(this._time);
    this._open = copy(this._open);
    this._high = copy(this._high);
    this._low = copy(this._low);
    this._close = copy(this._close);
    this._volume = copy(this._volume);
    this._capacity = newCap;
  }
}
