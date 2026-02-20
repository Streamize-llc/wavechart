import type { Renderer, RenderContext } from './renderer';

export interface AreaSeriesOptions {
  data: number[];
  lineColor?: string;
  topColor?: string;
  bottomColor?: string;
  lineWidth?: number;
}

/** Area series renderer: line + gradient fill below */
export class AreaRenderer implements Renderer {
  private _data: number[] = [];
  private _lineColor: string;
  private _topColor: string;
  private _bottomColor: string;
  private _lineWidth: number;

  constructor(options: AreaSeriesOptions) {
    this._data = options.data;
    this._lineColor = options.lineColor ?? '#2196F3';
    this._topColor = options.topColor ?? 'rgba(33, 150, 243, 0.4)';
    this._bottomColor = options.bottomColor ?? 'rgba(33, 150, 243, 0.0)';
    this._lineWidth = options.lineWidth ?? 2;
  }

  setData(data: number[]): void {
    this._data = data;
  }

  draw(rc: RenderContext): void {
    const { ctx, timeScale, priceScale, visibleRange, paneRect } = rc;
    const totalBars = rc.store.length;
    if (this._data.length === 0 || totalBars === 0) return;

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

    // Fill area
    const gradient = ctx.createLinearGradient(0, 0, 0, paneRect.height);
    gradient.addColorStop(0, this._topColor);
    gradient.addColorStop(1, this._bottomColor);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, paneRect.height);
    for (const p of points) {
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(points[points.length - 1].x, paneRect.height);
    ctx.closePath();
    ctx.fill();

    // Line on top
    ctx.strokeStyle = this._lineColor;
    ctx.lineWidth = this._lineWidth;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.restore();
  }
}
