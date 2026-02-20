import type { BarData } from '../core/types';

/** Data adapter interface for real-time data sources */
export interface DataAdapter {
  /** Connect to data source */
  connect(): void;

  /** Disconnect from data source */
  disconnect(): void;

  /** Subscribe to new bar events */
  onBar(callback: (bar: BarData) => void): void;

  /** Subscribe to bar update events (last bar update) */
  onUpdate(callback: (bar: Partial<BarData>) => void): void;

  /** Subscribe to historical data load */
  onHistorical(callback: (bars: BarData[]) => void): void;

  /** Request historical data */
  loadHistory?(from: number, to: number): void;
}
