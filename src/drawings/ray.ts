import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';

/** Ray (semi-infinite line from point 1 through point 2) */
export class RayDrawing extends Drawing {
  constructor(id: string, anchors: [DataAnchor, DataAnchor], color?: string, lineWidth?: number) {
    super(id, anchors, color, lineWidth);
  }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, ps: PriceScale, totalBars: number, paneWidth: number, paneHeight: number): void {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);

    // Extend line to edge of pane
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const scale = Math.max(paneWidth, paneHeight) * 2 / len;
    const endX = p1.x + dx * scale;
    const endY = p1.y + dy * scale;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

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

    // Only test in the direction of the ray
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const t = ((px - p1.x) * dx + (py - p1.y) * dy) / (dx * dx + dy * dy);
    if (t < 0) return Math.hypot(px - p1.x, py - p1.y) < 6;

    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    return Math.hypot(px - projX, py - projY) < 6;
  }
}
