import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';
import { dashPattern } from '../utils/shapes';

export interface PolylineOptions {
  lineColor?: string;
  fillColor?: string;
  lineStyle?: string;
  lineWidth?: number;
  curved?: boolean;
  closed?: boolean;
}

/**
 * Pine `polyline.new()` drawing — N-point connected lines.
 *
 * `curved=true` uses cardinal-spline interpolation (Catmull-Rom) for smooth
 * curves. `closed=true` closes the path back to the first point, enabling
 * polygon fills when `fillColor` is set.
 */
export class PolylineDrawing extends Drawing {
  fillColor: string;
  lineStyle: string;
  curved: boolean;
  closed: boolean;

  constructor(id: string, points: DataAnchor[], opts: PolylineOptions = {}) {
    super(id, points, opts.lineColor ?? '#2962FF', opts.lineWidth ?? 1);
    this.fillColor = opts.fillColor ?? '';
    this.lineStyle = opts.lineStyle ?? 'solid';
    this.curved = !!opts.curved;
    this.closed = !!opts.closed;
  }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, ps: PriceScale, totalBars: number): void {
    if (this.anchors.length < 2) return;
    const pts = this.anchors.map((a) => this.anchorToPixel(a, ts, ps, totalBars));

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const dash = dashPattern(this.lineStyle, this.lineWidth);
    if (dash.length) ctx.setLineDash(dash);

    ctx.beginPath();
    if (this.curved && pts.length >= 3) {
      this._drawCatmullRom(ctx, pts);
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
    }
    if (this.closed) ctx.closePath();

    if (this.fillColor && this.closed) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (this.selected) {
      ctx.fillStyle = this.color;
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /** Draw a smooth Catmull-Rom spline through all points. */
  private _drawCatmullRom(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]): void {
    const tension = 0.5;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) * tension / 3;
      const c1y = p1.y + (p2.y - p0.y) * tension / 3;
      const c2x = p2.x - (p3.x - p1.x) * tension / 3;
      const c2y = p2.y - (p3.y - p1.y) * tension / 3;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
    }
  }

  hitTest(px: number, py: number, ts: TimeScale, ps: PriceScale, totalBars: number): boolean {
    if (this.anchors.length < 2) return false;
    const pts = this.anchors.map((a) => this.anchorToPixel(a, ts, ps, totalBars));
    for (let i = 0; i < pts.length - 1; i++) {
      if (this.distToSegment(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) < 6) return true;
    }
    if (this.closed && pts.length >= 3) {
      const f = pts[0];
      const l = pts[pts.length - 1];
      if (this.distToSegment(px, py, l.x, l.y, f.x, f.y) < 6) return true;
    }
    return false;
  }
}
