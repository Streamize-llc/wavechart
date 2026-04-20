import type { Renderer, RenderContext } from './renderer';
import { roundToPixel, roundToInt } from '../utils/math';

/**
 * Candlestick renderer with path batching.
 * Bull and bear candles are drawn separately (2 fill + 2 stroke calls)
 * for maximum Canvas2D performance.
 *
 * `colorOverride[i]` (optional) replaces the bar's color — implements Pine
 * `barcolor(series)`. null/undefined entries use the default theme color.
 */
export class CandlestickRenderer implements Renderer {
  colorOverride: Array<string | null | undefined> | null = null;

  setColorOverride(colors: Array<string | null | undefined> | null): void {
    this.colorOverride = colors;
  }

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, priceScale, visibleRange, theme } = rc;
    const totalBars = store.length;
    if (totalBars === 0) return;
    const override = this.colorOverride;

    const openArr = store.open;
    const highArr = store.high;
    const lowArr = store.low;
    const closeArr = store.close;

    const barWidth = timeScale.barWidth;
    const halfBar = barWidth / 2;

    // Batch paths for bull and bear candles
    ctx.save();

    // ─── Bull candles (close >= open) ───
    ctx.fillStyle = theme.candle.upColor;
    ctx.strokeStyle = theme.candle.upBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const c = closeArr[i];
      const o = openArr[i];
      if (c < o) continue; // skip bear
      if (override && override[i]) continue; // handled in override pass

      const x = timeScale.barIndexToX(i, totalBars);
      const yHigh = priceScale.priceToY(highArr[i]);
      const yLow = priceScale.priceToY(lowArr[i]);
      const yOpen = priceScale.priceToY(o);
      const yClose = priceScale.priceToY(c);

      // Wick (vertical line)
      const wickX = roundToPixel(x);
      ctx.moveTo(wickX, yHigh);
      ctx.lineTo(wickX, yLow);

      // Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
      ctx.rect(
        roundToInt(x - halfBar),
        roundToInt(bodyTop),
        roundToInt(barWidth),
        roundToInt(bodyHeight)
      );
    }

    ctx.fill();
    ctx.stroke();

    // ─── Bear candles (close < open) ───
    ctx.fillStyle = theme.candle.downColor;
    ctx.strokeStyle = theme.candle.downBorderColor;
    ctx.beginPath();

    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const c = closeArr[i];
      const o = openArr[i];
      if (c >= o) continue; // skip bull
      if (override && override[i]) continue; // handled in override pass

      const x = timeScale.barIndexToX(i, totalBars);
      const yHigh = priceScale.priceToY(highArr[i]);
      const yLow = priceScale.priceToY(lowArr[i]);
      const yOpen = priceScale.priceToY(o);
      const yClose = priceScale.priceToY(c);

      // Wick
      const wickX = roundToPixel(x);
      ctx.moveTo(wickX, yHigh);
      ctx.lineTo(wickX, yLow);

      // Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
      ctx.rect(
        roundToInt(x - halfBar),
        roundToInt(bodyTop),
        roundToInt(barWidth),
        roundToInt(bodyHeight)
      );
    }

    ctx.fill();
    ctx.stroke();

    // ─── Override pass (Pine `barcolor`) ────────────────────
    if (override) {
      // Group bars by color for fewer state changes
      const byColor = new Map<string, number[]>();
      for (let i = visibleRange.from; i <= visibleRange.to; i++) {
        const col = override[i];
        if (!col) continue;
        const arr = byColor.get(col) ?? [];
        arr.push(i);
        byColor.set(col, arr);
      }
      for (const [color, indices] of byColor) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (const i of indices) {
          const o = openArr[i];
          const c = closeArr[i];
          const x = timeScale.barIndexToX(i, totalBars);
          const yHigh = priceScale.priceToY(highArr[i]);
          const yLow = priceScale.priceToY(lowArr[i]);
          const yOpen = priceScale.priceToY(o);
          const yClose = priceScale.priceToY(c);
          const wickX = roundToPixel(x);
          ctx.moveTo(wickX, yHigh);
          ctx.lineTo(wickX, yLow);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
          ctx.rect(
            roundToInt(x - halfBar),
            roundToInt(bodyTop),
            roundToInt(barWidth),
            roundToInt(bodyHeight),
          );
        }
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
