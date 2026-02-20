import { CanvasLayer } from './canvas-layer';

/**
 * Dual canvas pair: Main (static data) + Overlay (dynamic crosshair/drawings).
 * Overlay sits on top of Main via z-index stacking.
 */
export class DualCanvas {
  readonly main: CanvasLayer;
  readonly overlay: CanvasLayer;

  constructor() {
    this.main = new CanvasLayer();
    this.overlay = new CanvasLayer();

    this.main.canvas.style.zIndex = '1';
    this.overlay.canvas.style.zIndex = '2';
  }

  /** Attach both canvases to a parent element */
  attach(parent: HTMLElement): void {
    parent.appendChild(this.main.canvas);
    parent.appendChild(this.overlay.canvas);
  }

  /** Resize both canvases */
  resize(width: number, height: number): void {
    this.main.resize(width, height);
    this.overlay.resize(width, height);
  }

  /** Get logical width */
  get width(): number {
    return this.main.width;
  }

  /** Get logical height */
  get height(): number {
    return this.main.height;
  }

  /** Destroy both canvases */
  destroy(): void {
    this.main.destroy();
    this.overlay.destroy();
  }
}
