import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';
import { withAlpha } from '../utils/color';

/** Rectangle area drawing */
export class RectangleDrawing extends Drawing {
  fillColor: string;

  constructor(id: string, anchors: [DataAnchor, DataAnchor], color?: string) {
    super(id, anchors, color ?? '#42A5F5', 1);
    this.fillColor = withAlpha(this.color, 0.15);
  }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, ps: PriceScale, totalBars: number): void {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);

    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    ctx.save();

    // Fill
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(x, y, w, h);

    // Border
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.strokeRect(x, y, w, h);

    // Anchor dots if selected
    if (this.selected) {
      ctx.fillStyle = this.color;
      for (const p of [p1, p2, { x: p1.x, y: p2.y }, { x: p2.x, y: p1.y }]) {
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

    const left = Math.min(p1.x, p2.x);
    const right = Math.max(p1.x, p2.x);
    const top = Math.min(p1.y, p2.y);
    const bottom = Math.max(p1.y, p2.y);

    // Hit if near border
    const near = 6;
    const inX = px >= left - near && px <= right + near;
    const inY = py >= top - near && py <= bottom + near;
    const nearLeft = Math.abs(px - left) < near;
    const nearRight = Math.abs(px - right) < near;
    const nearTop = Math.abs(py - top) < near;
    const nearBottom = Math.abs(py - bottom) < near;

    return inX && inY && (nearLeft || nearRight || nearTop || nearBottom);
  }
}
