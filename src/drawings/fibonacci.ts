import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';
import { withAlpha } from '../utils/color';

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

/** Fibonacci retracement drawing */
export class FibonacciDrawing extends Drawing {
  constructor(id: string, anchors: [DataAnchor, DataAnchor], color?: string) {
    super(id, anchors, color ?? '#FFD54F', 1);
  }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, ps: PriceScale, totalBars: number, paneWidth: number): void {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);

    const price1 = this.anchors[0].price;
    const price2 = this.anchors[1].price;
    const range = price1 - price2;

    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < FIB_LEVELS.length; i++) {
      const level = FIB_LEVELS[i];
      const price = price2 + range * level;
      const y = Math.round(ps.priceToY(price)) + 0.5;

      // Line
      ctx.strokeStyle = this.color;
      ctx.lineWidth = level === 0 || level === 1 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(paneWidth, y);
      ctx.stroke();

      // Fill between levels
      if (i < FIB_LEVELS.length - 1) {
        const nextPrice = price2 + range * FIB_LEVELS[i + 1];
        const nextY = ps.priceToY(nextPrice);
        ctx.fillStyle = withAlpha(this.color, 0.05 + level * 0.08);
        ctx.fillRect(0, Math.min(y, nextY), paneWidth, Math.abs(nextY - y));
      }

      // Label
      ctx.fillStyle = this.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${(level * 100).toFixed(1)}% (${price.toFixed(2)})`, 4, y);
    }

    if (this.selected) {
      ctx.fillStyle = this.color;
      for (const p of [p1, p2]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  hitTest(px: number, py: number, _ts: TimeScale, ps: PriceScale, _totalBars: number): boolean {
    const price1 = this.anchors[0].price;
    const price2 = this.anchors[1].price;
    const range = price1 - price2;

    for (const level of FIB_LEVELS) {
      const price = price2 + range * level;
      const y = ps.priceToY(price);
      if (Math.abs(py - y) < 6) return true;
    }
    return false;
  }
}
