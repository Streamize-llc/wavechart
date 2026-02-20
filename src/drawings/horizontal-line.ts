import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';

/** Horizontal price level line */
export class HorizontalLineDrawing extends Drawing {
  constructor(id: string, price: number, color?: string, lineWidth?: number) {
    super(id, [{ barIndex: 0, price }], color, lineWidth);
  }

  get price(): number { return this.anchors[0].price; }
  set price(v: number) { this.anchors[0].price = v; }

  render(ctx: CanvasRenderingContext2D, _ts: TimeScale, ps: PriceScale, _totalBars: number, paneWidth: number): void {
    const y = Math.round(ps.priceToY(this.price)) + 0.5;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(paneWidth, y);
    ctx.stroke();

    // Price label
    ctx.fillStyle = this.color;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.price.toFixed(2), paneWidth - 4, y - 2);

    ctx.restore();
  }

  hitTest(px: number, py: number, _ts: TimeScale, ps: PriceScale, _totalBars: number): boolean {
    const y = ps.priceToY(this.price);
    return Math.abs(py - y) < 6;
  }

  move(_deltaBarIndex: number, deltaPrice: number): void {
    this.price += deltaPrice;
  }
}
