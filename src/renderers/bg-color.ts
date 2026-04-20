import type { Renderer, RenderContext } from './renderer';

/**
 * Per-bar background strip renderer (Pine `bgcolor`).
 *
 * `colors` is a per-bar color array (null/empty = skip). If `uniform` is
 * provided, every bar uses that color instead.
 */
export interface BgColorOptions {
  colors?: Array<string | null | undefined>;
  uniform?: string | null;
  offset?: number;
}

export class BgColorRenderer implements Renderer {
  constructor(private readonly opts: BgColorOptions) {}

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, visibleRange, paneRect } = rc;
    const totalBars = store.length;
    const offset = this.opts.offset ?? 0;
    const colors = this.opts.colors;
    const uniform = this.opts.uniform;

    if (!colors && !uniform) return;

    ctx.save();
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const idx = i - offset;
      const c = uniform ?? (colors && idx >= 0 && idx < colors.length ? colors[idx] : null);
      if (!c) continue;
      const x = timeScale.barIndexToX(i, totalBars);
      const w = Math.max(1, timeScale.barSpacing);
      ctx.fillStyle = c;
      ctx.fillRect(x - w / 2, 0, w, paneRect.height);
    }
    ctx.restore();
  }
}
