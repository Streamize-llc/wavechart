import type { Renderer, RenderContext } from './renderer';
import { computeTimeWeight, formatTime, TimeWeight } from '../utils/format';

/**
 * Time axis (X-axis) label renderer.
 * Uses weight-based hierarchy: year > month > day > hour > minute.
 */
export class TimeAxisRenderer implements Renderer {
  /** Minimum pixel spacing between labels */
  minLabelSpacing = 80;

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, paneRect, visibleRange, theme } = rc;
    const totalBars = store.length;
    if (totalBars === 0) return;

    ctx.save();
    ctx.fillStyle = theme.timeScale.textColor;
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const timeArr = store.time;
    let lastLabelX = -this.minLabelSpacing;
    const centerY = paneRect.height / 2;

    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const x = timeScale.barIndexToX(i, totalBars);
      if (x < 0 || x > paneRect.width) continue;

      const prev = i > 0 ? timeArr[i - 1] : null;
      const weight = computeTimeWeight(timeArr[i], prev);

      // Only show labels at significant time boundaries with min spacing
      if (weight >= TimeWeight.Hour && x - lastLabelX >= this.minLabelSpacing) {
        const text = formatTime(timeArr[i], weight);

        // Bolder for higher weight (year, month)
        if (weight >= TimeWeight.Month) {
          ctx.font = `bold ${theme.fontSize}px ${theme.fontFamily}`;
        } else {
          ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
        }

        ctx.fillText(text, x, centerY);
        lastLabelX = x;
      }
    }

    ctx.restore();
  }
}
