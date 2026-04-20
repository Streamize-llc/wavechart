import type { Renderer, RenderContext } from './renderer';

/**
 * Pine `plotcandle` / `plotbar` — draws an overlay candle series using
 * user-supplied open/high/low/close arrays (e.g. Heikin Ashi, Renko).
 *
 * Distinct from wavechart's primary `CandlestickRenderer` which reads from
 * the main DataStore.
 */
export interface PlotCandleOptions {
  open: Array<number | null>;
  high: Array<number | null>;
  low: Array<number | null>;
  close: Array<number | null>;
  color?: string;       // body color override (applied to both bull and bear)
  wickColor?: string;   // wick color; default = body color
  borderColor?: string; // outline color; default = body color
  /** 'candle' (default) draws solid body + wick; 'bar' draws OHLC tick bars. */
  style?: 'candle' | 'bar';
}

export class PlotCandleRenderer implements Renderer {
  constructor(private readonly opts: PlotCandleOptions) {}

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, priceScale, visibleRange, theme } = rc;
    const total = store.length;
    const { open, high, low, close } = this.opts;
    const style = this.opts.style ?? 'candle';

    const barW = Math.max(1, timeScale.barWidth);
    const bodyW = Math.max(1, Math.floor(barW * 0.7));

    ctx.save();
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      if (i >= open.length || i >= total) continue;
      const o = open[i], c = close[i];
      const h = high[i], l = low[i];
      if (o == null || c == null || !Number.isFinite(o) || !Number.isFinite(c)) continue;

      const x = timeScale.barIndexToX(i, total);
      const oY = priceScale.priceToY(o as number);
      const cY = priceScale.priceToY(c as number);
      const hY = (h != null && Number.isFinite(h)) ? priceScale.priceToY(h as number) : Math.min(oY, cY);
      const lY = (l != null && Number.isFinite(l)) ? priceScale.priceToY(l as number) : Math.max(oY, cY);

      const isBull = (c as number) >= (o as number);
      const fill = this.opts.color ?? (isBull ? theme.candle.upColor : theme.candle.downColor);
      const wick = this.opts.wickColor ?? fill;
      const border = this.opts.borderColor ?? fill;

      const xPix = Math.round(x) + 0.5;

      if (style === 'bar') {
        // OHLC bar: vertical line + left tick (open) + right tick (close)
        ctx.strokeStyle = wick;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xPix, hY);
        ctx.lineTo(xPix, lY);
        ctx.stroke();

        const tick = Math.max(1, Math.floor(bodyW / 2));
        ctx.beginPath();
        ctx.moveTo(xPix - tick, oY);
        ctx.lineTo(xPix, oY);
        ctx.moveTo(xPix, cY);
        ctx.lineTo(xPix + tick, cY);
        ctx.stroke();
        continue;
      }

      // Candle: wick + body
      ctx.strokeStyle = wick;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xPix, hY);
      ctx.lineTo(xPix, lY);
      ctx.stroke();

      const top = Math.min(oY, cY);
      const height = Math.max(1, Math.abs(cY - oY));
      const bodyX = Math.round(x - bodyW / 2);
      ctx.fillStyle = fill;
      ctx.fillRect(bodyX, Math.round(top), bodyW, Math.round(height));
      if (border !== fill) {
        ctx.strokeStyle = border;
        ctx.strokeRect(bodyX + 0.5, Math.round(top) + 0.5, bodyW - 1, Math.round(height) - 1);
      }
    }
    ctx.restore();
  }
}
