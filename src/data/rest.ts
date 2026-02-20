import type { BarData } from '../core/types';
import type { DataAdapter } from './adapter';

export interface RestAdapterOptions {
  /** URL to fetch OHLCV data from */
  url: string;
  /** Polling interval in ms (0 = no polling) */
  pollInterval?: number;
  /** Transform response JSON to BarData[] */
  transform?: (data: unknown) => BarData[];
  /** Headers to include in requests */
  headers?: Record<string, string>;
}

/** REST API data adapter with optional polling */
export class RestDataAdapter implements DataAdapter {
  private _opts: Required<RestAdapterOptions>;
  private _barCb: ((bar: BarData) => void) | null = null;
  private _updateCb: ((bar: Partial<BarData>) => void) | null = null;
  private _historicalCb: ((bars: BarData[]) => void) | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _lastTime = 0;

  constructor(opts: RestAdapterOptions) {
    this._opts = {
      url: opts.url,
      pollInterval: opts.pollInterval ?? 0,
      transform: opts.transform ?? ((d) => d as BarData[]),
      headers: opts.headers ?? {},
    };
  }

  async connect(): Promise<void> {
    await this._fetch();

    if (this._opts.pollInterval > 0) {
      this._pollTimer = setInterval(() => this._poll(), this._opts.pollInterval);
    }
  }

  disconnect(): void {
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  onBar(callback: (bar: BarData) => void): void {
    this._barCb = callback;
  }

  onUpdate(callback: (bar: Partial<BarData>) => void): void {
    this._updateCb = callback;
  }

  onHistorical(callback: (bars: BarData[]) => void): void {
    this._historicalCb = callback;
  }

  private async _fetch(): Promise<void> {
    try {
      const resp = await fetch(this._opts.url, { headers: this._opts.headers });
      const json = await resp.json();
      const bars = this._opts.transform(json);

      if (bars.length > 0) {
        this._lastTime = bars[bars.length - 1].time;
        this._historicalCb?.(bars);
      }
    } catch (e) {
      console.error('RestDataAdapter fetch error:', e);
    }
  }

  private async _poll(): Promise<void> {
    try {
      const resp = await fetch(this._opts.url, { headers: this._opts.headers });
      const json = await resp.json();
      const bars = this._opts.transform(json);

      for (const bar of bars) {
        if (bar.time > this._lastTime) {
          this._lastTime = bar.time;
          this._barCb?.(bar);
        } else if (bar.time === this._lastTime) {
          this._updateCb?.(bar);
        }
      }
    } catch (e) {
      console.error('RestDataAdapter poll error:', e);
    }
  }
}
