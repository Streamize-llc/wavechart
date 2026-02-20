import type { BarData } from '../core/types';
import type { DataAdapter } from './adapter';

/** Static array data adapter (no real-time updates) */
export class StaticDataAdapter implements DataAdapter {
  private _bars: BarData[];
  private _onHistoricalCb: ((bars: BarData[]) => void) | null = null;

  constructor(bars: BarData[]) {
    this._bars = bars;
  }

  connect(): void {
    this._onHistoricalCb?.(this._bars);
  }

  disconnect(): void {}

  onBar(_callback: (bar: BarData) => void): void {}
  onUpdate(_callback: (bar: Partial<BarData>) => void): void {}

  onHistorical(callback: (bars: BarData[]) => void): void {
    this._onHistoricalCb = callback;
  }
}
