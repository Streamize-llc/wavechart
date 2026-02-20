import type { Renderer, RenderContext } from './renderer';

export interface LineSeriesOptions {
  data: number[];
  color?: string;
  lineWidth?: number;
}

/** Line series renderer with NaN gap handling */
export class LineRenderer implements Renderer {
  private _data: number[] = [];
  private _color: string;
  private _lineWidth: number;

  constructor(options: LineSeriesOptions) {
    this._data = options.data;
    this._color = options.color ?? '#2196F3';
    this._lineWidth = options.lineWidth ?? 2;
  }

  setData(data: number[]): void {
    this._data = data;
  }

  draw(rc: RenderContext): void {
    const { ctx, timeScale, priceScale, visibleRange, theme } = rc;
    const totalBars = rc.store.length;
    if (this._data.length === 0 || totalBars === 0) return;

    ctx.save();
    ctx.strokeStyle = this._color;
    ctx.lineWidth = this._lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    let drawing = false;

    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      if (i >= this._data.length) break;
      const v = this._data[i];

      if (!isFinite(v)) {
        drawing = false;
        continue;
      }

      const x = timeScale.barIndexToX(i, totalBars);
      const y = priceScale.priceToY(v);

      if (!drawing) {
        ctx.moveTo(x, y);
        drawing = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }
}
