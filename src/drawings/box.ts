import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';
import { dashPattern } from '../utils/shapes';
import { withAlpha } from '../utils/color';

export interface BoxOptions {
  borderColor?: string;
  bgcolor?: string;
  borderWidth?: number;
  borderStyle?: string;
  extend?: 'none' | 'left' | 'right' | 'both';
  text?: string;
  textSize?: string;
  textColor?: string;
  textHalign?: 'left' | 'center' | 'right';
  textValign?: 'top' | 'center' | 'bottom';
  textWrap?: string;
}

/**
 * Pine `box.new()` drawing — bordered rectangle with optional text inside.
 * Differs from RectangleDrawing: supports text, border styles, and horizontal
 * extend. RectangleDrawing stays as the interactive user-drawable variant.
 */
export class BoxDrawing extends Drawing {
  borderColor: string;
  bgcolor: string;
  borderStyle: string;
  extend: 'none' | 'left' | 'right' | 'both';
  text: string;
  textSize: string;
  textColor: string;
  textHalign: 'left' | 'center' | 'right';
  textValign: 'top' | 'center' | 'bottom';

  constructor(id: string, anchors: [DataAnchor, DataAnchor], opts: BoxOptions = {}) {
    super(id, anchors, opts.borderColor ?? '#42A5F5', opts.borderWidth ?? 1);
    this.borderColor = opts.borderColor ?? '#42A5F5';
    this.bgcolor = opts.bgcolor ?? withAlpha(this.borderColor, 0.15);
    this.borderStyle = opts.borderStyle ?? 'solid';
    this.extend = opts.extend ?? 'none';
    this.text = opts.text ?? '';
    this.textSize = opts.textSize ?? 'normal';
    this.textColor = opts.textColor ?? '#FFFFFF';
    this.textHalign = opts.textHalign ?? 'center';
    this.textValign = opts.textValign ?? 'center';
  }

  render(
    ctx: CanvasRenderingContext2D,
    ts: TimeScale,
    ps: PriceScale,
    totalBars: number,
    paneWidth: number,
  ): void {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);
    let left = Math.min(p1.x, p2.x);
    let right = Math.max(p1.x, p2.x);
    const top = Math.min(p1.y, p2.y);
    const bot = Math.max(p1.y, p2.y);

    if (this.extend === 'left' || this.extend === 'both') left = 0;
    if (this.extend === 'right' || this.extend === 'both') right = paneWidth;

    const w = right - left;
    const h = bot - top;

    ctx.save();
    if (this.bgcolor) {
      ctx.fillStyle = this.bgcolor;
      ctx.fillRect(left, top, w, h);
    }
    if (this.borderColor && this.lineWidth > 0) {
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = this.lineWidth;
      const dash = dashPattern(this.borderStyle, this.lineWidth);
      if (dash.length) ctx.setLineDash(dash);
      ctx.strokeRect(left, top, w, h);
      ctx.setLineDash([]);
    }

    if (this.text) {
      const fontSize = this._fontSize();
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = this.textColor;
      ctx.textAlign = this.textHalign;
      ctx.textBaseline = this.textValign === 'center' ? 'middle'
        : this.textValign === 'top' ? 'top' : 'bottom';
      const tx = this.textHalign === 'left' ? left + 4
        : this.textHalign === 'right' ? right - 4
        : left + w / 2;
      const ty = this.textValign === 'top' ? top + 4
        : this.textValign === 'bottom' ? bot - 4
        : top + h / 2;
      ctx.fillText(this.text, tx, ty);
    }

    if (this.selected) {
      ctx.fillStyle = this.borderColor;
      for (const p of [p1, p2, { x: p1.x, y: p2.y }, { x: p2.x, y: p1.y }]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private _fontSize(): number {
    switch (this.textSize) {
      case 'tiny': return 9;
      case 'small': return 11;
      case 'large': return 16;
      case 'huge': return 20;
      default: return 12;
    }
  }

  hitTest(px: number, py: number, ts: TimeScale, ps: PriceScale, totalBars: number): boolean {
    const p1 = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const p2 = this.anchorToPixel(this.anchors[1], ts, ps, totalBars);
    const left = Math.min(p1.x, p2.x);
    const right = Math.max(p1.x, p2.x);
    const top = Math.min(p1.y, p2.y);
    const bot = Math.max(p1.y, p2.y);
    const near = 6;
    return px >= left - near && px <= right + near &&
           py >= top - near && py <= bot + near;
  }
}
