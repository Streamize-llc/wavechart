import { Drawing, type DataAnchor } from './drawing';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';
import { drawShape, sizeToPx } from '../utils/shapes';
import { withAlpha } from '../utils/color';

export type LabelStyle =
  | 'none'
  | 'xcross' | 'cross' | 'triangleup' | 'triangledown' | 'flag'
  | 'circle' | 'arrowup' | 'arrowdown'
  | 'square' | 'diamond' | 'text_outline'
  | 'label_up' | 'label_down' | 'label_left' | 'label_right' | 'label_center'
  | 'label_upper_left' | 'label_upper_right' | 'label_lower_left' | 'label_lower_right';

export type LabelYloc = 'price' | 'abovebar' | 'belowbar';

export interface LabelOptions {
  text?: string;
  yloc?: LabelYloc;
  bgcolor?: string;
  style?: LabelStyle;
  textcolor?: string;
  size?: string;
  textalign?: 'left' | 'center' | 'right';
  tooltip?: string;
  highSeries?: number[];
  lowSeries?: number[];
}

/**
 * Pine `label.new()` drawing — bubble/marker + text, anchored to a bar.
 *
 * Differences from TextDrawing: supports 21 label.style_* shapes, bubble
 * background, and yloc anchoring (price/abovebar/belowbar).
 */
export class LabelDrawing extends Drawing {
  text = '';
  yloc: LabelYloc = 'price';
  bgcolor = '';
  style: LabelStyle = 'label_down';
  textcolor = '';
  size = 'normal';
  textalign: 'left' | 'center' | 'right' = 'center';
  tooltip = '';
  highSeries?: number[];
  lowSeries?: number[];

  constructor(id: string, anchor: DataAnchor, opts: LabelOptions = {}) {
    super(id, [anchor], opts.bgcolor || '#2962FF', 1);
    this.text = opts.text ?? '';
    this.yloc = opts.yloc ?? 'price';
    this.bgcolor = opts.bgcolor ?? '';
    this.style = opts.style ?? 'label_down';
    this.textcolor = opts.textcolor ?? '';
    this.size = opts.size ?? 'normal';
    this.textalign = opts.textalign ?? 'center';
    this.tooltip = opts.tooltip ?? '';
    this.highSeries = opts.highSeries;
    this.lowSeries = opts.lowSeries;
  }

  render(ctx: CanvasRenderingContext2D, ts: TimeScale, ps: PriceScale, totalBars: number): void {
    const a = this.anchors[0];
    const px = sizeToPx(this.size, 12);
    const x = ts.barIndexToX(a.barIndex, totalBars);
    let y: number;
    if (this.yloc === 'abovebar' && this.highSeries && a.barIndex < this.highSeries.length) {
      y = ps.priceToY(this.highSeries[a.barIndex]) - px;
    } else if (this.yloc === 'belowbar' && this.lowSeries && a.barIndex < this.lowSeries.length) {
      y = ps.priceToY(this.lowSeries[a.barIndex]) + px;
    } else {
      y = ps.priceToY(a.price);
    }

    const bg = this.bgcolor || this.color;
    const fg = this.textcolor || '#FFFFFF';

    ctx.save();
    ctx.font = `${px}px sans-serif`;
    ctx.textBaseline = 'middle';

    // Label bubbles (label_up, label_down, label_left, label_right, label_center)
    // → rounded rect + pointer triangle
    if (this.style.startsWith('label_') && this.style !== 'label_center') {
      this._renderBubble(ctx, x, y, bg, fg, px);
    } else if (this.style === 'label_center') {
      this._renderCenterBubble(ctx, x, y, bg, fg, px);
    } else if (this.style === 'text_outline') {
      ctx.fillStyle = fg;
      ctx.strokeStyle = bg;
      ctx.lineWidth = 3;
      ctx.textAlign = this.textalign;
      ctx.strokeText(this.text, x, y);
      ctx.fillText(this.text, x, y);
    } else if (this.style === 'none') {
      ctx.fillStyle = fg;
      ctx.textAlign = this.textalign;
      ctx.fillText(this.text, x, y);
    } else {
      // Geometric marker styles: triangle/circle/flag/etc. + optional text above
      drawShape(ctx, this.style, x, y, px, bg);
      if (this.text) {
        ctx.fillStyle = this.textcolor || bg;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, x, y - px);
      }
    }

    if (this.selected) {
      ctx.strokeStyle = bg;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x - px, y - px, px * 2, px * 2);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  private _renderBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bg: string,
    fg: string,
    px: number,
  ): void {
    const padX = 6, padY = 4;
    const tw = ctx.measureText(this.text).width;
    const bw = Math.max(tw + padX * 2, px);
    const bh = px + padY * 2;
    const ptr = 6;

    // Anchor pointer direction
    let boxX = x - bw / 2;
    let boxY = y - bh / 2;
    let ptrStart: [number, number];
    let ptrMid: [number, number];
    let ptrEnd: [number, number];

    switch (this.style) {
      case 'label_up':
        boxY = y - bh - ptr;
        ptrStart = [x - ptr, boxY + bh];
        ptrMid = [x, y];
        ptrEnd = [x + ptr, boxY + bh];
        break;
      case 'label_down':
        boxY = y + ptr;
        ptrStart = [x - ptr, boxY];
        ptrMid = [x, y];
        ptrEnd = [x + ptr, boxY];
        break;
      case 'label_left':
        boxX = x - bw - ptr;
        ptrStart = [boxX + bw, y - ptr];
        ptrMid = [x, y];
        ptrEnd = [boxX + bw, y + ptr];
        break;
      case 'label_right':
        boxX = x + ptr;
        ptrStart = [boxX, y - ptr];
        ptrMid = [x, y];
        ptrEnd = [boxX, y + ptr];
        break;
      default: {
        // upper_left / upper_right / lower_left / lower_right
        const up = this.style.includes('upper');
        const left = this.style.includes('left');
        boxX = left ? x - bw - ptr : x + ptr;
        boxY = up ? y - bh - ptr : y + ptr;
        const cornerX = left ? boxX + bw : boxX;
        const cornerY = up ? boxY + bh : boxY;
        ptrStart = [cornerX, cornerY - ptr];
        ptrMid = [x, y];
        ptrEnd = [cornerX - (left ? -ptr : ptr), cornerY];
        break;
      }
    }

    // Rounded rect
    ctx.fillStyle = bg;
    ctx.strokeStyle = bg;
    ctx.beginPath();
    this._roundRect(ctx, boxX, boxY, bw, bh, 4);
    ctx.fill();
    // Pointer
    ctx.beginPath();
    ctx.moveTo(...ptrStart);
    ctx.lineTo(...ptrMid);
    ctx.lineTo(...ptrEnd);
    ctx.closePath();
    ctx.fill();
    // Text
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, boxX + bw / 2, boxY + bh / 2);
  }

  private _renderCenterBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bg: string,
    fg: string,
    px: number,
  ): void {
    const padX = 6, padY = 4;
    const tw = ctx.measureText(this.text).width;
    const bw = Math.max(tw + padX * 2, px);
    const bh = px + padY * 2;
    ctx.fillStyle = bg;
    ctx.beginPath();
    this._roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 4);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, x, y);
  }

  private _roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  hitTest(px: number, py: number, ts: TimeScale, ps: PriceScale, totalBars: number): boolean {
    const p = this.anchorToPixel(this.anchors[0], ts, ps, totalBars);
    const s = sizeToPx(this.size, 12);
    return px >= p.x - s && px <= p.x + s && py >= p.y - s && py <= p.y + s;
  }
}

// Silence unused-import warning on `withAlpha` (reserved for future hover state).
void withAlpha;
