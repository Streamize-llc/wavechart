import type { Renderer, RenderContext } from './renderer';

export interface BaselineSeriesOptions {
  data: number[];
  baseValue: number;
  topLineColor?: string;
  bottomLineColor?: string;
  topFillColor?: string;
  bottomFillColor?: string;
  lineWidth?: number;
}

/** Baseline renderer: different colors above/below base value */
export class BaselineRenderer implements Renderer {
  private _data: number[] = [];
  private _baseValue: number;
  private _topLineColor: string;
  private _bottomLineColor: string;
  private _topFillColor: string;
  private _bottomFillColor: string;
  private _lineWidth: number;

  constructor(options: BaselineSeriesOptions) {
    this._data = options.data;
    this._baseValue = options.baseValue;
    this._topLineColor = options.topLineColor ?? '#26A69A';
    this._bottomLineColor = options.bottomLineColor ?? '#EF5350';
    this._topFillColor = options.topFillColor ?? 'rgba(38, 166, 154, 0.2)';
    this._bottomFillColor = options.bottomFillColor ?? 'rgba(239, 83, 80, 0.2)';
    this._lineWidth = options.lineWidth ?? 2;
  }

  setData(data: number[]): void {
    this._data = data;
  }

  draw(rc: RenderContext): void {
    const { ctx, timeScale, priceScale, visibleRange, paneRect } = rc;
    const totalBars = rc.store.length;
    if (this._data.length === 0 || totalBars === 0) return;

    const baseY = priceScale.priceToY(this._baseValue);

    // Collect visible points
    const points: { x: number; y: number }[] = [];
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      if (i >= this._data.length) break;
      const v = this._data[i];
      if (!isFinite(v)) continue;
      points.push({
        x: timeScale.barIndexToX(i, totalBars),
        y: priceScale.priceToY(v),
      });
    }

    if (points.length < 2) return;

    ctx.save();

    // Top fill (above baseline) — clip to above
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, paneRect.width, baseY);
    ctx.clip();

    ctx.fillStyle = this._topFillColor;
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(points[points.length - 1].x, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this._topLineColor;
    ctx.lineWidth = this._lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();

    // Bottom fill (below baseline) — clip to below
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, baseY, paneRect.width, paneRect.height - baseY);
    ctx.clip();

    ctx.fillStyle = this._bottomFillColor;
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(points[points.length - 1].x, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this._bottomLineColor;
    ctx.lineWidth = this._lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();

    // Base line
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(paneRect.width, baseY);
    ctx.stroke();

    ctx.restore();
  }
}
