import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';
import { dashPattern, drawArrowHead } from '../utils/shapes';

export type TrendlineStyle = 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both';
export type TrendlineExtend = 'none' | 'left' | 'right' | 'both';

/** Two-point trendline drawing. Supports Pine `line.new` style + extend. */
export class TrendlineDrawing extends Drawing {
  style: TrendlineStyle = 'solid';
  extend: TrendlineExtend = 'none';

  constructor(
    id: string,
    anchors: [DataAnchor, DataAnchor],
    color?: string,
    lineWidth?: number,
    style?: TrendlineStyle,
    extend?: TrendlineExtend,
  ) {
    super(id, anchors, color, lineWidth);
    if (style) this.style = style;
    if (extend) this.extend = extend;
  }

  render(
    ctx: CanvasRenderingContext2D,
    ts: TimeScale,
    ps: PriceScale,
    totalBars: number,
    paneWidth: number,
  ): void {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);

    // Extend to pane edge if requested
    let x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
    if (this.extend === 'right' || this.extend === 'both') {
      if (dx !== 0) {
        const tR = (paneWidth - p1.x) / dx;
        if (tR > 1) { x2 = paneWidth; y2 = p1.y + dy * tR; }
      }
    }
    if (this.extend === 'left' || this.extend === 'both') {
      if (dx !== 0) {
        const tL = (0 - p1.x) / dx;
        if (tL < 0) { x1 = 0; y1 = p1.y + dy * tL; }
      }
    }

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    const dash = dashPattern(this.style, this.lineWidth);
    if (dash.length) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (this.style === 'arrow_right' || this.style === 'arrow_both') {
      drawArrowHead(ctx, p2.x, p2.y, Math.atan2(dy, dx), Math.max(8, this.lineWidth * 4), this.color);
    }
    if (this.style === 'arrow_left' || this.style === 'arrow_both') {
      drawArrowHead(ctx, p1.x, p1.y, Math.atan2(-dy, -dx), Math.max(8, this.lineWidth * 4), this.color);
    }

    if (this.selected) {
      ctx.fillStyle = this.color;
      for (const p of [p1, p2]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    void len;
  }

  hitTest(px: number, py: number, ts: TimeScale, ps: PriceScale, totalBars: number): boolean {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);
    return this.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) < 6;
  }
}
