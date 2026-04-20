import type { Renderer, RenderContext } from './renderer';

/**
 * Pine `plot()` renderer that dispatches on `plot.style_*` variants.
 *
 * Supported styles:
 *   line, linebr       — regular polyline (linebr = NaN forces gap, like default)
 *   stepline           — horizontal-vertical-horizontal steps
 *   stepline_diamond   — stepline + diamond markers at transitions
 *   histogram          — vertical bars to histbase
 *   columns            — thick bars to zero
 *   cross              — × marker at each bar
 *   circles            — filled circle at each bar
 *   area, areabr       — polyline with fill to histbase (areabr = with gaps)
 */
export type PlotStyle =
  | 'line'
  | 'linebr'
  | 'stepline'
  | 'stepline_diamond'
  | 'histogram'
  | 'columns'
  | 'cross'
  | 'circles'
  | 'area'
  | 'areabr';

export interface PlotLineOptions {
  data: number[];
  style?: PlotStyle;
  color?: string;
  lineWidth?: number;
  histbase?: number;
  offset?: number;
}

export class PlotLineRenderer implements Renderer {
  constructor(private readonly opts: PlotLineOptions) {}

  setData(data: number[]) { this.opts.data = data; }

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, priceScale, visibleRange } = rc;
    const totalBars = store.length;
    const { data, color = '#2196F3', lineWidth = 2, offset = 0 } = this.opts;
    const style = this.opts.style ?? 'line';
    if (!data || data.length === 0) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const getValid = (i: number): number | null => {
      const idx = i - offset;
      if (idx < 0 || idx >= data.length) return null;
      const v = data[idx];
      return isFinite(v) ? v : null;
    };

    const histbase = this.opts.histbase ?? 0;
    const baseY = priceScale.priceToY(histbase);

    switch (style) {
      case 'histogram':
      case 'columns': {
        const halfW = Math.max(1, timeScale.barSpacing * (style === 'columns' ? 0.7 : 0.3));
        for (let i = visibleRange.from; i <= visibleRange.to; i++) {
          const v = getValid(i);
          if (v == null) continue;
          const x = timeScale.barIndexToX(i, totalBars);
          const y = priceScale.priceToY(v);
          ctx.fillRect(x - halfW / 2, Math.min(y, baseY), halfW, Math.abs(y - baseY));
        }
        break;
      }

      case 'circles': {
        const r = Math.max(2, lineWidth);
        for (let i = visibleRange.from; i <= visibleRange.to; i++) {
          const v = getValid(i);
          if (v == null) continue;
          const x = timeScale.barIndexToX(i, totalBars);
          const y = priceScale.priceToY(v);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'cross': {
        const s = Math.max(4, lineWidth * 3);
        for (let i = visibleRange.from; i <= visibleRange.to; i++) {
          const v = getValid(i);
          if (v == null) continue;
          const x = timeScale.barIndexToX(i, totalBars);
          const y = priceScale.priceToY(v);
          ctx.beginPath();
          ctx.moveTo(x - s / 2, y);
          ctx.lineTo(x + s / 2, y);
          ctx.moveTo(x, y - s / 2);
          ctx.lineTo(x, y + s / 2);
          ctx.stroke();
        }
        break;
      }

      case 'stepline':
      case 'stepline_diamond': {
        let prevX = 0, prevY = 0;
        let drawing = false;
        for (let i = visibleRange.from; i <= visibleRange.to; i++) {
          const v = getValid(i);
          if (v == null) { drawing = false; continue; }
          const x = timeScale.barIndexToX(i, totalBars);
          const y = priceScale.priceToY(v);
          if (!drawing) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            drawing = true;
          } else {
            ctx.lineTo(x, prevY);  // horizontal from prevY
            ctx.lineTo(x, y);      // vertical to new y
          }
          if (style === 'stepline_diamond' && drawing) {
            ctx.stroke();
            const d = Math.max(3, lineWidth * 2);
            ctx.beginPath();
            ctx.moveTo(x, y - d);
            ctx.lineTo(x + d, y);
            ctx.lineTo(x, y + d);
            ctx.lineTo(x - d, y);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, y);
          }
          prevX = x; prevY = y;
        }
        if (drawing) ctx.stroke();
        void prevX;
        break;
      }

      case 'area':
      case 'areabr': {
        ctx.beginPath();
        let drawing = false;
        let firstX = 0;
        for (let i = visibleRange.from; i <= visibleRange.to; i++) {
          const v = getValid(i);
          if (v == null) {
            if (drawing) {
              ctx.lineTo(firstX, baseY);
              ctx.closePath();
              ctx.globalAlpha = 0.2;
              ctx.fill();
              ctx.globalAlpha = 1;
              ctx.stroke();
              ctx.beginPath();
              drawing = false;
            }
            continue;
          }
          const x = timeScale.barIndexToX(i, totalBars);
          const y = priceScale.priceToY(v);
          if (!drawing) {
            firstX = x;
            ctx.moveTo(x, baseY);
            ctx.lineTo(x, y);
            drawing = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        if (drawing) {
          const lastX = timeScale.barIndexToX(visibleRange.to, totalBars);
          ctx.lineTo(lastX, baseY);
          ctx.lineTo(firstX, baseY);
          ctx.closePath();
          ctx.globalAlpha = 0.2;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
        }
        break;
      }

      case 'line':
      case 'linebr':
      default: {
        ctx.beginPath();
        let drawing = false;
        for (let i = visibleRange.from; i <= visibleRange.to; i++) {
          const v = getValid(i);
          if (v == null) { drawing = false; continue; }
          const x = timeScale.barIndexToX(i, totalBars);
          const y = priceScale.priceToY(v);
          if (!drawing) { ctx.moveTo(x, y); drawing = true; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }
}
