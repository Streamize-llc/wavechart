import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';

/** Two-point trendline drawing */
export class TrendlineDrawing extends Drawing {
  constructor(id: string, anchors: [DataAnchor, DataAnchor], color?: string, lineWidth?: number) {
    super(id, anchors, color, lineWidth);
  }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, ps: PriceScale, totalBars: number): void {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Draw anchor dots if selected
    if (this.selected) {
      ctx.fillStyle = this.color;
      for (const p of [p1, p2]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  hitTest(px: number, py: number, ts: TimeScale, ps: PriceScale, totalBars: number): boolean {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);
    return this.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) < 6;
  }
}
