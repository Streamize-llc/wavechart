import { Drawing } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';

/** Vertical time line */
export class VerticalLineDrawing extends Drawing {
  constructor(id: string, barIndex: number, color?: string, lineWidth?: number) {
    super(id, [{ barIndex, price: 0 }], color, lineWidth);
  }

  get barIndex(): number { return this.anchors[0].barIndex; }
  set barIndex(v: number) { this.anchors[0].barIndex = v; }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, _ps: PriceScale, totalBars: number, _pw: number, paneHeight: number): void {
    const x = Math.round(ts.barIndexToX(this.barIndex, totalBars)) + 0.5;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, paneHeight);
    ctx.stroke();
    ctx.restore();
  }

  hitTest(px: number, _py: number, ts: TimeScale, _ps: PriceScale, totalBars: number): boolean {
    const x = ts.barIndexToX(this.barIndex, totalBars);
    return Math.abs(px - x) < 6;
  }

  move(deltaBarIndex: number): void {
    this.barIndex += deltaBarIndex;
  }
}
