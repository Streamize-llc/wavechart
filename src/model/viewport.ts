import type { VisibleRange } from '../core/types';
import { clamp } from '../utils/math';

/**
 * Viewport state: manages scroll offset, bar spacing, and visible range.
 * Shared across all panes via the TimeScale.
 */
export class Viewport {
  /** Scroll offset in bar-index units (float). 0 = rightmost bar at right edge. */
  scrollOffset = 0;
  /** Pixels per bar (including gap) */
  barSpacing = 8;

  private _minBarSpacing = 1;
  private _maxBarSpacing = 50;
  private _rightOffset = 5;
  private _chartWidth = 0;

  configure(opts: {
    barSpacing?: number;
    minBarSpacing?: number;
    maxBarSpacing?: number;
    rightOffset?: number;
  }): void {
    if (opts.barSpacing !== undefined) this.barSpacing = opts.barSpacing;
    if (opts.minBarSpacing !== undefined) this._minBarSpacing = opts.minBarSpacing;
    if (opts.maxBarSpacing !== undefined) this._maxBarSpacing = opts.maxBarSpacing;
    if (opts.rightOffset !== undefined) this._rightOffset = opts.rightOffset;
  }

  setChartWidth(width: number): void {
    this._chartWidth = width;
  }

  /** Number of bars that fit in the chart area */
  get barsInView(): number {
    return Math.ceil(this._chartWidth / this.barSpacing);
  }

  /** Compute visible bar index range */
  computeVisibleRange(totalBars: number): VisibleRange {
    if (totalBars === 0) return { from: 0, to: 0 };

    // rightEdgeBarIndex: the bar index at the right edge of the chart
    const rightEdgeBarIndex = totalBars - 1 - this._rightOffset + this.scrollOffset;
    const leftEdgeBarIndex = rightEdgeBarIndex - this.barsInView;

    const from = Math.max(0, Math.floor(leftEdgeBarIndex));
    const to = Math.min(totalBars - 1, Math.ceil(rightEdgeBarIndex));

    return { from, to };
  }

  /** Scroll by delta in bar units */
  scroll(deltaBars: number, totalBars: number): void {
    this.scrollOffset += deltaBars;
    this._clampScroll(totalBars);
  }

  /** Zoom by changing bar spacing, anchored at a pixel position */
  zoom(factor: number, anchorX: number, totalBars: number): void {
    const oldSpacing = this.barSpacing;
    const newSpacing = clamp(
      oldSpacing * factor,
      this._minBarSpacing,
      this._maxBarSpacing
    );

    // Adjust scrollOffset to keep the anchor bar in place
    const anchorBar = this.xToBarIndex(anchorX, totalBars);
    this.barSpacing = newSpacing;
    const newAnchorX = this.barIndexToX(anchorBar, totalBars);
    const deltaX = anchorX - newAnchorX;
    this.scrollOffset += deltaX / this.barSpacing;
    this._clampScroll(totalBars);
  }

  /** Convert bar index to X pixel coordinate */
  barIndexToX(barIndex: number, totalBars: number): number {
    const rightEdgeBarIndex = totalBars - 1 - this._rightOffset + this.scrollOffset;
    return this._chartWidth - (rightEdgeBarIndex - barIndex) * this.barSpacing;
  }

  /** Convert X pixel coordinate to bar index (float) */
  xToBarIndex(x: number, totalBars: number): number {
    const rightEdgeBarIndex = totalBars - 1 - this._rightOffset + this.scrollOffset;
    return rightEdgeBarIndex - (this._chartWidth - x) / this.barSpacing;
  }

  /** Fit all bars in view */
  fitContent(totalBars: number): void {
    if (totalBars <= 0) return;
    const availableWidth = this._chartWidth;
    this.barSpacing = clamp(
      availableWidth / (totalBars + this._rightOffset),
      this._minBarSpacing,
      this._maxBarSpacing
    );
    this.scrollOffset = 0;
  }

  /** Scroll to a specific bar index (center it) */
  scrollToBar(barIndex: number, totalBars: number): void {
    const barsFromRight = totalBars - 1 - barIndex;
    const centerOffset = this.barsInView / 2;
    this.scrollOffset = -(barsFromRight - centerOffset - this._rightOffset);
    this._clampScroll(totalBars);
  }

  private _clampScroll(totalBars: number): void {
    const maxScroll = totalBars + this._rightOffset;
    const minScroll = -(this.barsInView - this._rightOffset);
    this.scrollOffset = clamp(this.scrollOffset, minScroll, maxScroll);
  }
}
