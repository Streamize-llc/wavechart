import type { VisibleRange } from '../core/types';
import { Viewport } from '../model/viewport';
import { DataStore } from '../model/store';

/**
 * Shared X-axis: converts between bar indices and pixel X coordinates.
 * All panes share a single TimeScale instance.
 */
export class TimeScale {
  readonly viewport: Viewport;

  /** Height of the time axis area in pixels */
  height = 28;

  constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  /** Set the available chart width (excluding price scale) */
  setWidth(width: number): void {
    this.viewport.setChartWidth(width);
  }

  /** Get visible bar range */
  getVisibleRange(store: DataStore): VisibleRange {
    return this.viewport.computeVisibleRange(store.length);
  }

  /** Convert bar index to X pixel */
  barIndexToX(barIndex: number, totalBars: number): number {
    return this.viewport.barIndexToX(barIndex, totalBars);
  }

  /** Convert X pixel to bar index (rounded to nearest integer) */
  xToBarIndex(x: number, totalBars: number): number {
    return Math.round(this.viewport.xToBarIndex(x, totalBars));
  }

  /** Convert X pixel to bar index (raw float) */
  xToBarIndexFloat(x: number, totalBars: number): number {
    return this.viewport.xToBarIndex(x, totalBars);
  }

  /** Get the bar width in pixels (for candlestick body) */
  get barWidth(): number {
    return Math.max(1, this.viewport.barSpacing * 0.7);
  }

  /** Get bar spacing */
  get barSpacing(): number {
    return this.viewport.barSpacing;
  }
}
