import type { Renderer, RenderContext } from './renderer';
import { roundToInt } from '../utils/math';

export interface HistogramSeriesOptions {
  data: number[];
  positiveColor?: string;
  negativeColor?: string;
}

/** Histogram bar renderer (positive/negative color split) */
export class HistogramRenderer implements Renderer {
  private _data: number[] = [];
  private _positiveColor: string;
  private _negativeColor: string;

  constructor(options: HistogramSeriesOptions) {
    this._data = options.data;
    this._positiveColor = options.positiveColor ?? '#26A69A';
    this._negativeColor = options.negativeColor ?? '#EF5350';
  }

  setData(data: number[]): void {
    this._data = data;
  }

  draw(rc: RenderContext): void {
    const { ctx, timeScale, priceScale, visibleRange } = rc;
    const totalBars = rc.store.length;
    if (this._data.length === 0 || totalBars === 0) return;

    const barWidth = Math.max(1, timeScale.barWidth * 0.8);
    const halfBar = barWidth / 2;
    const zeroY = priceScale.priceToY(0);

    ctx.save();

    // Positive bars
    ctx.fillStyle = this._positiveColor;
    ctx.beginPath();
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      if (i >= this._data.length) break;
      const v = this._data[i];
      if (!isFinite(v) || v < 0) continue;

      const x = timeScale.barIndexToX(i, totalBars);
      const y = priceScale.priceToY(v);
      ctx.rect(
        roundToInt(x - halfBar),
        roundToInt(Math.min(y, zeroY)),
        roundToInt(barWidth),
        roundToInt(Math.abs(y - zeroY)) || 1
      );
    }
    ctx.fill();

    // Negative bars
    ctx.fillStyle = this._negativeColor;
    ctx.beginPath();
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      if (i >= this._data.length) break;
      const v = this._data[i];
      if (!isFinite(v) || v >= 0) continue;

      const x = timeScale.barIndexToX(i, totalBars);
      const y = priceScale.priceToY(v);
      ctx.rect(
        roundToInt(x - halfBar),
        roundToInt(Math.min(y, zeroY)),
        roundToInt(barWidth),
        roundToInt(Math.abs(y - zeroY)) || 1
      );
    }
    ctx.fill();

    ctx.restore();
  }
}
