import type { Renderer, RenderContext } from './renderer';
import { roundToPixel } from '../utils/math';
import { computeTimeWeight, TimeWeight } from '../utils/format';

/** Grid lines renderer (horizontal price lines + vertical time lines) */
export class GridRenderer implements Renderer {
  draw(rc: RenderContext): void {
    const { ctx, paneRect, priceScale, timeScale, store, visibleRange, theme } = rc;

    if (!theme.grid.color) return;

    ctx.save();
    ctx.strokeStyle = theme.grid.color;
    ctx.lineWidth = 1;

    if (theme.grid.style === 'dashed') {
      ctx.setLineDash([4, 4]);
    }

    // Horizontal grid lines (price ticks)
    const priceTicks = priceScale.getTicks();
    ctx.beginPath();
    for (const tick of priceTicks) {
      const y = roundToPixel(paneRect.y + priceScale.priceToY(tick));
      ctx.moveTo(paneRect.x, y);
      ctx.lineTo(paneRect.x + paneRect.width, y);
    }
    ctx.stroke();

    // Vertical grid lines (time ticks at day/month/year boundaries)
    ctx.beginPath();
    const totalBars = store.length;
    const timeArr = store.time;
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const prev = i > 0 ? timeArr[i - 1] : null;
      const weight = computeTimeWeight(timeArr[i], prev);

      if (weight >= TimeWeight.Day) {
        const x = roundToPixel(timeScale.barIndexToX(i, totalBars));
        if (x >= paneRect.x && x <= paneRect.x + paneRect.width) {
          ctx.moveTo(x, paneRect.y);
          ctx.lineTo(x, paneRect.y + paneRect.height);
        }
      }
    }
    ctx.stroke();

    ctx.restore();
  }
}
