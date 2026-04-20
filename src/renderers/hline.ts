import type { Renderer, RenderContext } from './renderer';
import { dashPattern } from '../utils/shapes';

/**
 * Horizontal constant-price line (Pine `hline`). Spans the full pane width;
 * unlike HorizontalLineDrawing it is a per-pane series renderer, not a user
 * drawing — not selectable, not movable.
 */
export interface HLineOptions {
  price: number;
  color?: string;
  linestyle?: string;  // solid | dotted | dashed
  linewidth?: number;
  label?: string;
}

export class HLineRenderer implements Renderer {
  constructor(private readonly opts: HLineOptions) {}

  draw(rc: RenderContext): void {
    const { ctx, priceScale, paneRect } = rc;
    const o = this.opts;
    const y = Math.round(priceScale.priceToY(o.price)) + 0.5;
    if (y < 0 || y > paneRect.height) return;

    ctx.save();
    ctx.strokeStyle = o.color ?? '#787B86';
    ctx.lineWidth = o.linewidth ?? 1;
    const dash = dashPattern(o.linestyle ?? 'dashed', ctx.lineWidth);
    if (dash.length) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(paneRect.width, y);
    ctx.stroke();
    if (o.label) {
      ctx.fillStyle = o.color ?? '#787B86';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.setLineDash([]);
      ctx.fillText(o.label, paneRect.width - 4, y - 2);
    }
    ctx.restore();
  }
}
