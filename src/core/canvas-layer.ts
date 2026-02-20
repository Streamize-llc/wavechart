import { getDevicePixelRatio } from '../utils/dpr';

/** Single canvas wrapper with HiDPI auto-scaling */
export class CanvasLayer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  /** Logical (CSS) width */
  private _width = 0;
  /** Logical (CSS) height */
  private _height = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  /** Resize canvas handling HiDPI */
  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    const dpr = getDevicePixelRatio();

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Clear entire canvas */
  clear(): void {
    const dpr = getDevicePixelRatio();
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /** Destroy and remove canvas element */
  destroy(): void {
    this.canvas.remove();
  }
}
