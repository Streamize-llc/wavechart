import type { Point } from '../core/types';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';

/** Anchor point in data space */
export interface DataAnchor {
  barIndex: number;
  price: number;
}

/** Base class for all drawings */
export abstract class Drawing {
  id: string;
  anchors: DataAnchor[];
  color: string;
  lineWidth: number;
  selected = false;

  constructor(id: string, anchors: DataAnchor[], color = '#FFFFFF', lineWidth = 1) {
    this.id = id;
    this.anchors = anchors;
    this.color = color;
    this.lineWidth = lineWidth;
  }

  /** Convert data anchor to pixel point */
  protected anchorToPixel(
    anchor: DataAnchor,
    timeScale: TimeScale,
    priceScale: PriceScale,
    totalBars: number
  ): Point {
    return {
      x: timeScale.barIndexToX(anchor.barIndex, totalBars),
      y: priceScale.priceToY(anchor.price),
    };
  }

  /** Render the drawing */
  abstract render(
    ctx: CanvasRenderingContext2D,
    timeScale: TimeScale,
    priceScale: PriceScale,
    totalBars: number,
    paneWidth: number,
    paneHeight: number
  ): void;

  /** Hit test: returns true if point is near this drawing */
  abstract hitTest(
    px: number,
    py: number,
    timeScale: TimeScale,
    priceScale: PriceScale,
    totalBars: number
  ): boolean;

  /** Move all anchors by a delta */
  move(deltaBarIndex: number, deltaPrice: number): void {
    for (const a of this.anchors) {
      a.barIndex += deltaBarIndex;
      a.price += deltaPrice;
    }
  }

  /** Distance from point to line segment */
  protected distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }
}

export type DrawingType = 'trendline' | 'horizontal-line' | 'vertical-line' | 'ray' | 'fibonacci' | 'rectangle' | 'text';
