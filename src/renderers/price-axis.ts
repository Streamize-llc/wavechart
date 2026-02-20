import type { Renderer, RenderContext } from './renderer';
import { formatPrice, detectPrecision } from '../utils/format';

/**
 * Price axis (Y-axis) label renderer.
 * Draws price tick labels and the current price tag.
 */
export class PriceAxisRenderer implements Renderer {
  private _precision = 2;

  setPrecision(precision: number): void {
    this._precision = precision;
  }

  draw(rc: RenderContext): void {
    const { ctx, priceScale, paneRect, theme, store } = rc;

    ctx.save();
    ctx.fillStyle = theme.priceScale.textColor;
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ticks = priceScale.getTicks();
    const xRight = paneRect.width - 8;

    for (const price of ticks) {
      const y = priceScale.priceToY(price);
      if (y >= 4 && y <= paneRect.height - 4) {
        ctx.fillText(formatPrice(price, this._precision), xRight, y);
      }
    }

    // Current price line (dashed line from last close across chart)
    if (store.length > 0) {
      const lastClose = store.close[store.length - 1];
      const lastOpen = store.open[store.length - 1];
      const isBull = lastClose >= lastOpen;
      const y = priceScale.priceToY(lastClose);

      if (y >= 0 && y <= paneRect.height) {
        ctx.strokeStyle = isBull ? theme.candle.upColor : theme.candle.downColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(paneRect.width, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }
}
