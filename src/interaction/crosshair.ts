import type { Chart } from '../chart';
import type { Renderer, RenderContext } from '../renderers/renderer';
import { DirtyFlag } from '../core/scheduler';
import { roundToPixel } from '../utils/math';
import { formatPrice } from '../utils/format';

/**
 * Crosshair renderer: draws vertical + horizontal lines on the overlay canvas.
 * Snaps to nearest bar data point.
 */
export class CrosshairRenderer implements Renderer {
  private _chart: Chart;

  constructor(chart: Chart) {
    this._chart = chart;
  }

  draw(rc: RenderContext): void {
    if (!this._chart._crosshairVisible) return;

    const { ctx, paneRect, theme, priceScale, store, timeScale } = rc;
    const barIndex = this._chart._crosshairBarIndex;
    const totalBars = store.length;

    if (barIndex < 0 || barIndex >= totalBars) return;

    ctx.save();
    ctx.strokeStyle = theme.crosshair.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Vertical line (snapped to bar)
    const x = roundToPixel(timeScale.barIndexToX(barIndex, totalBars));
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, paneRect.height);
    ctx.stroke();

    // Horizontal line (at mouse Y)
    const y = roundToPixel(this._chart._crosshairY);
    if (y >= 0 && y <= paneRect.height) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(paneRect.width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Price label on Y axis edge
    if (y >= 0 && y <= paneRect.height) {
      const price = priceScale.yToPrice(this._chart._crosshairY);
      const text = formatPrice(price, this._chart.pricePrecision);
      const textWidth = ctx.measureText(text).width;
      const labelW = textWidth + 10;
      const labelH = 18;
      const labelX = paneRect.width - labelW;

      ctx.fillStyle = theme.crosshair.labelBackground;
      ctx.fillRect(labelX, y - labelH / 2, labelW, labelH);
      ctx.fillStyle = theme.crosshair.labelTextColor;
      ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, labelX + labelW / 2, y);
    }

    ctx.restore();
  }

  /** Update crosshair position */
  updatePosition(localX: number, localY: number): void {
    const totalBars = this._chart.store.length;
    if (totalBars === 0) return;

    const barIndex = this._chart.timeScale.xToBarIndex(localX, totalBars);
    const clampedIndex = Math.max(0, Math.min(totalBars - 1, barIndex));

    this._chart._crosshairBarIndex = clampedIndex;
    this._chart._crosshairX = this._chart.timeScale.barIndexToX(clampedIndex, totalBars);
    this._chart._crosshairY = localY;
    this._chart._crosshairVisible = true;

    this._chart.scheduler.invalidate(DirtyFlag.Overlay);
  }

  /** Hide crosshair */
  hide(): void {
    this._chart._crosshairVisible = false;
    this._chart.scheduler.invalidate(DirtyFlag.Overlay);
  }
}
