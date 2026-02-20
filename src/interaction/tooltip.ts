import type { Chart } from '../chart';
import type { Renderer, RenderContext } from '../renderers/renderer';
import { formatPrice } from '../utils/format';

/**
 * OHLCV tooltip / legend renderer.
 * Shows data for the hovered bar in top-left corner (TradingView style).
 */
export class TooltipRenderer implements Renderer {
  private _chart: Chart;

  constructor(chart: Chart) {
    this._chart = chart;
  }

  draw(rc: RenderContext): void {
    if (!this._chart._crosshairVisible) return;

    const { ctx, store, theme } = rc;
    const barIndex = this._chart._crosshairBarIndex;

    if (barIndex < 0 || barIndex >= store.length) return;

    const bar = store.getBar(barIndex);
    if (!bar) return;

    const precision = this._chart.pricePrecision;
    const isBull = bar.close >= bar.open;

    ctx.save();
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = 'top';

    const x = 8;
    let y = 8;
    const lineHeight = theme.fontSize + 4;

    // Date
    const date = new Date(bar.time * 1000);
    const dateStr = date.toISOString().slice(0, 16).replace('T', ' ');
    ctx.fillStyle = theme.textColor;
    ctx.fillText(dateStr, x, y);
    y += lineHeight;

    // OHLCV values
    const valueColor = isBull ? theme.candle.upColor : theme.candle.downColor;
    const labels = [
      { label: 'O', value: bar.open },
      { label: 'H', value: bar.high },
      { label: 'L', value: bar.low },
      { label: 'C', value: bar.close },
    ];

    let xPos = x;
    for (const item of labels) {
      ctx.fillStyle = theme.textColor;
      ctx.fillText(`${item.label} `, xPos, y);
      xPos += ctx.measureText(`${item.label} `).width;

      ctx.fillStyle = valueColor;
      const valStr = formatPrice(item.value, precision) + '  ';
      ctx.fillText(valStr, xPos, y);
      xPos += ctx.measureText(valStr).width;
    }

    // Volume
    if (bar.volume && bar.volume > 0) {
      y += lineHeight;
      ctx.fillStyle = theme.textColor;
      ctx.fillText(`Vol `, x, y);
      ctx.fillStyle = valueColor;
      ctx.fillText(formatVolume(bar.volume), x + ctx.measureText('Vol ').width, y);
    }

    ctx.restore();
  }
}

function formatVolume(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(0);
}
