import type { Renderer, RenderContext } from './renderer';

export interface WatermarkOptions {
  text?: string;
  color?: string;
  fontSize?: number;
}

/** Watermark text rendered in center of pane */
export class WatermarkRenderer implements Renderer {
  private _text: string;
  private _color: string;
  private _fontSize: number;

  constructor(options: WatermarkOptions = {}) {
    this._text = options.text ?? '';
    this._color = options.color ?? 'rgba(88, 92, 107, 0.2)';
    this._fontSize = options.fontSize ?? 48;
  }

  draw(rc: RenderContext): void {
    if (!this._text) return;

    const { ctx, paneRect } = rc;

    ctx.save();
    ctx.fillStyle = this._color;
    ctx.font = `bold ${this._fontSize}px ${rc.theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._text, paneRect.width / 2, paneRect.height / 2);
    ctx.restore();
  }
}
