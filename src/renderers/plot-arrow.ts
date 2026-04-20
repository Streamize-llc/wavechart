import type { Renderer, RenderContext } from './renderer';

/**
 * Pine `plotarrow` — variable-length arrows above/below each bar.
 *
 * Positive values draw an upward arrow above the bar's high; negative values
 * draw a downward arrow below the bar's low. The arrow length scales with
 * abs(value) between `minHeight` and `maxHeight` (in pixels), normalized to
 * the series' max absolute value.
 */
export interface PlotArrowOptions {
  values: Array<number | null>;
  colorUp?: string;
  colorDown?: string;
  minHeight?: number;  // pixels; default 5
  maxHeight?: number;  // pixels; default 100
  offset?: number;
}

export class PlotArrowRenderer implements Renderer {
  private readonly _maxAbs: number;

  constructor(private readonly opts: PlotArrowOptions) {
    let maxAbs = 0;
    for (const v of opts.values) {
      if (v != null && Number.isFinite(v)) {
        const av = Math.abs(v);
        if (av > maxAbs) maxAbs = av;
      }
    }
    this._maxAbs = maxAbs;
  }

  draw(rc: RenderContext): void {
    if (this._maxAbs === 0) return;
    const { ctx, store, timeScale, priceScale, visibleRange } = rc;
    const total = store.length;
    const opts = this.opts;
    const colorUp = opts.colorUp ?? '#26A69A';
    const colorDown = opts.colorDown ?? '#EF5350';
    const minH = opts.minHeight ?? 5;
    const maxH = opts.maxHeight ?? 100;
    const offset = opts.offset ?? 0;

    const barW = Math.max(2, timeScale.barWidth);
    const shaftW = Math.max(1, Math.floor(barW * 0.18));
    const headW = Math.max(4, Math.floor(barW * 0.55));

    ctx.save();
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const idx = i - offset;
      if (idx < 0 || idx >= opts.values.length || idx >= total) continue;
      const v = opts.values[idx];
      if (v == null || !Number.isFinite(v) || v === 0) continue;

      const magnitude = Math.min(1, Math.abs(v) / this._maxAbs);
      const length = minH + (maxH - minH) * magnitude;
      const headH = Math.min(length * 0.45, Math.max(4, headW * 0.6));
      const shaftH = Math.max(1, length - headH);

      const x = timeScale.barIndexToX(i, total);
      const isUp = v > 0;
      const anchor = isUp ? store.high[idx] : store.low[idx];
      if (!Number.isFinite(anchor)) continue;
      const anchorY = priceScale.priceToY(anchor);
      const dir = isUp ? -1 : 1;
      const baseY = anchorY + dir * (isUp ? -2 : 2);
      const shaftEndY = baseY + dir * shaftH;
      const tipY = baseY + dir * length;

      ctx.fillStyle = isUp ? colorUp : colorDown;
      ctx.beginPath();
      ctx.moveTo(x - shaftW / 2, baseY);
      ctx.lineTo(x - shaftW / 2, shaftEndY);
      ctx.lineTo(x - headW / 2, shaftEndY);
      ctx.lineTo(x, tipY);
      ctx.lineTo(x + headW / 2, shaftEndY);
      ctx.lineTo(x + shaftW / 2, shaftEndY);
      ctx.lineTo(x + shaftW / 2, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
