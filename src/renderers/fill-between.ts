import type { Renderer, RenderContext } from './renderer';
import { withAlpha } from '../utils/color';

/**
 * Fill the area between two series (Pine `fill(plot1, plot2, color)` or
 * `fill(hline1, hline2, color)`). Also supports the v5 gradient form via
 * topValue/bottomValue/topColor/bottomColor.
 */
export interface FillBetweenOptions {
  series1: number[] | null;
  series2: number[] | null;
  color?: string;
  topValue?: number | null;
  bottomValue?: number | null;
  topColor?: string | null;
  bottomColor?: string | null;
  /** If set, replaces series1 (useful when fill targets an hline at a fixed price) */
  constant1?: number | null;
  constant2?: number | null;
}

export class FillBetweenRenderer implements Renderer {
  constructor(private readonly opts: FillBetweenOptions) {}

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, priceScale, visibleRange, paneRect } = rc;
    const totalBars = store.length;
    const opts = this.opts;
    const s1 = opts.series1;
    const s2 = opts.series2;
    const c1 = opts.constant1;
    const c2 = opts.constant2;

    if ((!s1 && c1 == null) || (!s2 && c2 == null)) return;

    const getV1 = (i: number): number | null =>
      c1 != null ? c1 : (s1 && i < s1.length ? s1[i] : null);
    const getV2 = (i: number): number | null =>
      c2 != null ? c2 : (s2 && i < s2.length ? s2[i] : null);

    const gradient = opts.topColor && opts.bottomColor;
    const baseColor = opts.color ?? '#2196F3';

    ctx.save();

    if (gradient && opts.topValue != null && opts.bottomValue != null) {
      const topY = priceScale.priceToY(opts.topValue);
      const botY = priceScale.priceToY(opts.bottomValue);
      const grad = ctx.createLinearGradient(0, topY, 0, botY);
      grad.addColorStop(0, opts.topColor!);
      grad.addColorStop(1, opts.bottomColor!);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = baseColor.includes('rgba') || baseColor.length === 9
        ? baseColor
        : withAlpha(baseColor, 0.2);
    }

    // Build polygon per contiguous valid-both run. `segStart` anchors the
    // bottom-edge backtrace so asymmetric NaN in s1 vs s2 can't leak across
    // previously-closed segments.
    const closeSegment = (from: number, to: number): void => {
      for (let j = to; j >= from; j--) {
        const b = getV2(j);
        if (b == null || !isFinite(b)) continue;
        ctx.lineTo(timeScale.barIndexToX(j, totalBars), priceScale.priceToY(b));
      }
      ctx.closePath();
      ctx.fill();
    };

    ctx.beginPath();
    let segStart = -1;
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const v1 = getV1(i);
      const v2 = getV2(i);
      const valid = v1 != null && v2 != null && isFinite(v1) && isFinite(v2);
      if (!valid) {
        if (segStart >= 0) {
          closeSegment(segStart, i - 1);
          ctx.beginPath();
          segStart = -1;
        }
        continue;
      }
      const x = timeScale.barIndexToX(i, totalBars);
      const y = priceScale.priceToY(v1!);
      if (segStart < 0) {
        segStart = i;
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    if (segStart >= 0) {
      closeSegment(segStart, visibleRange.to);
    }

    ctx.restore();
    void paneRect; // reserved for future clipping
  }
}
