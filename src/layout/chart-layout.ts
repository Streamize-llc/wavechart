import type { Rect } from '../core/types';
import type { ResolvedChartOptions } from '../model/options';
import { Pane } from './pane';
import { TimeScale } from './time-scale';

/**
 * Manages overall layout: distributes container space among panes,
 * time axis, and price axis areas.
 */
export class ChartLayout {
  private _containerWidth = 0;
  private _containerHeight = 0;
  private _priceScaleWidth = 65;
  private _timeAxisHeight = 28;

  readonly panes: Pane[] = [];
  readonly timeScale: TimeScale;

  constructor(timeScale: TimeScale) {
    this.timeScale = timeScale;
  }

  get containerWidth(): number { return this._containerWidth; }
  get containerHeight(): number { return this._containerHeight; }

  /** Area available for chart content (excluding axes) */
  get chartAreaWidth(): number {
    return Math.max(0, this._containerWidth - this._priceScaleWidth);
  }

  get chartAreaHeight(): number {
    return Math.max(0, this._containerHeight - this._timeAxisHeight);
  }

  /** Price scale area rect */
  get priceScaleRect(): Rect {
    return {
      x: this.chartAreaWidth,
      y: 0,
      width: this._priceScaleWidth,
      height: this.chartAreaHeight,
    };
  }

  /** Time axis area rect */
  get timeAxisRect(): Rect {
    return {
      x: 0,
      y: this.chartAreaHeight,
      width: this.chartAreaWidth,
      height: this._timeAxisHeight,
    };
  }

  /** Add a pane */
  addPane(pane: Pane): void {
    this.panes.push(pane);
  }

  /** Remove a pane */
  removePane(paneId: string): void {
    const idx = this.panes.findIndex((p) => p.id === paneId);
    if (idx >= 0) {
      this.panes[idx].destroy();
      this.panes.splice(idx, 1);
    }
  }

  /** Update dimensions and recalculate pane rects */
  resize(width: number, height: number, options: ResolvedChartOptions): void {
    this._containerWidth = width;
    this._containerHeight = height;
    this._priceScaleWidth = options.priceScale.width;
    this._timeAxisHeight = this.timeScale.height;

    this.timeScale.setWidth(this.chartAreaWidth);
    this._distributePanes();
  }

  /**
   * Recalculate pane sizes.
   * Fixed-height panes (sub-panes) get their exact requested height.
   * Remaining space goes to proportional panes (main pane).
   */
  private _distributePanes(): void {
    if (this.panes.length === 0) return;

    const totalHeight = this.chartAreaHeight;

    // First pass: allocate fixed-height panes
    let fixedTotal = 0;
    for (const pane of this.panes) {
      if (pane.fixedHeight != null) {
        fixedTotal += Math.max(pane.minHeight, pane.fixedHeight);
      }
    }

    // Remaining space for proportional panes
    const remaining = Math.max(0, totalHeight - fixedTotal);
    const proportionalPanes = this.panes.filter(p => p.fixedHeight == null);
    const totalWeight = proportionalPanes.reduce((sum, p) => sum + p.heightWeight, 0) || 1;

    let y = 0;
    for (let i = 0; i < this.panes.length; i++) {
      const pane = this.panes[i];
      let paneHeight: number;

      if (pane.fixedHeight != null) {
        paneHeight = Math.max(pane.minHeight, pane.fixedHeight);
      } else {
        paneHeight = Math.round((pane.heightWeight / totalWeight) * remaining);
      }

      // Last pane gets remaining pixels to avoid rounding gaps
      if (i === this.panes.length - 1) {
        paneHeight = totalHeight - y;
      }

      pane.setRect({
        x: 0,
        y,
        width: this.chartAreaWidth,
        height: Math.max(pane.minHeight, paneHeight),
      });

      pane.priceScale.width = this._priceScaleWidth;
      y += pane.rect.height;
    }
  }
}
