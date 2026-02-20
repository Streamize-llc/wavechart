import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';

/** Text annotation drawing */
export class TextDrawing extends Drawing {
  text: string;
  fontSize: number;

  constructor(id: string, anchor: DataAnchor, text: string, color?: string, fontSize?: number) {
    super(id, [anchor], color ?? '#FFFFFF', 1);
    this.text = text;
    this.fontSize = fontSize ?? 14;
  }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, ps: PriceScale, totalBars: number): void {
    const p = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.text, p.x, p.y);

    if (this.selected) {
      const metrics = ctx.measureText(this.text);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(p.x - 2, p.y - this.fontSize - 2, metrics.width + 4, this.fontSize + 4);
    }

    ctx.restore();
  }

  hitTest(px: number, py: number, ts: TimeScale, ps: PriceScale, totalBars: number): boolean {
    const p = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    // Approximate hit area
    return px >= p.x - 4 && px <= p.x + this.text.length * this.fontSize * 0.6 + 4 &&
           py >= p.y - this.fontSize - 4 && py <= p.y + 4;
  }
}
