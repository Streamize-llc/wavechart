import type { Renderer, RenderContext } from './renderer';
import { drawShape, sizeToPx } from '../utils/shapes';

/**
 * Per-bar shape marker renderer (Pine plotshape / plotchar).
 *
 * `condition` is a truthy-per-bar series; shapes are drawn only where truthy.
 * Supports text overlays and Pine `location.*` anchoring.
 */
export interface ShapeSeriesOptions {
  condition: Array<boolean | number | null>;
  shape?: string;              // Pine shape.* name; 'char' to draw the `char` field instead
  char?: string;               // single character for plotchar
  location?: 'abovebar' | 'belowbar' | 'top' | 'bottom' | 'absolute';
  color?: string;
  text?: string | null;
  textcolor?: string | null;
  size?: string;
  offset?: number;
  highSeries?: number[];       // override for 'abovebar' location
  lowSeries?: number[];        // override for 'belowbar' location
  absoluteSeries?: number[];   // value array for location.absolute
}

export class ShapeSeriesRenderer implements Renderer {
  constructor(private readonly opts: ShapeSeriesOptions) {}

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, priceScale, visibleRange, paneRect } = rc;
    const totalBars = store.length;
    const opts = this.opts;
    const color = opts.color ?? '#FF9800';
    const px = sizeToPx(opts.size, opts.char ? 14 : 10);
    const loc = opts.location ?? 'abovebar';
    const offset = opts.offset ?? 0;

    ctx.save();
    ctx.font = `${px}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const idx = i - offset;
      if (idx < 0 || idx >= opts.condition.length) continue;
      const v = opts.condition[idx];
      if (v == null || v === false || (typeof v === 'number' && (v === 0 || Number.isNaN(v)))) continue;

      const barX = timeScale.barIndexToX(i, totalBars);

      let anchorY: number;
      switch (loc) {
        case 'belowbar': {
          const low = opts.lowSeries?.[i] ?? store.low[i];
          anchorY = priceScale.priceToY(low) + px * 0.9;
          break;
        }
        case 'abovebar': {
          const high = opts.highSeries?.[i] ?? store.high[i];
          anchorY = priceScale.priceToY(high) - px * 0.9;
          break;
        }
        case 'top':
          anchorY = 4 + px / 2;
          break;
        case 'bottom':
          anchorY = paneRect.height - 4 - px / 2;
          break;
        case 'absolute':
        default: {
          const val = opts.absoluteSeries?.[i];
          if (val == null || !isFinite(val)) continue;
          anchorY = priceScale.priceToY(val);
        }
      }

      if (opts.char) {
        ctx.fillStyle = color;
        ctx.fillText(opts.char, barX, anchorY);
      } else {
        drawShape(ctx, opts.shape ?? 'cross', barX, anchorY, px, color);
      }

      if (opts.text) {
        ctx.fillStyle = opts.textcolor ?? color;
        const textY = loc === 'belowbar' ? anchorY + px : anchorY - px;
        ctx.font = `${Math.max(10, px * 0.8)}px sans-serif`;
        ctx.fillText(opts.text, barX, textY);
        ctx.font = `${px}px sans-serif`;
      }
    }

    ctx.restore();
  }
}
