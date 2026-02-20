import type { Rect, VisibleRange } from '../core/types';
import type { Renderer, RenderContext } from '../renderers/renderer';
import type { Theme } from '../themes/types';
import { DualCanvas } from '../core/dual-canvas';
import { PriceScale } from './price-scale';
import { TimeScale } from './time-scale';
import { DataStore } from '../model/store';

/**
 * A single chart pane: owns a DualCanvas pair and a PriceScale.
 * Main pane shows candles; sub-panes show indicators.
 */
export class Pane {
  readonly id: string;
  readonly dualCanvas: DualCanvas;
  readonly priceScale: PriceScale;

  /** Renderers drawn on the main canvas */
  readonly mainRenderers: Renderer[] = [];
  /** Renderers drawn on the overlay canvas */
  readonly overlayRenderers: Renderer[] = [];

  /** Pane rect in chart-level pixel coordinates */
  rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  /** Configured height weight (for proportional sizing when no fixedHeight) */
  heightWeight = 1;
  /** Fixed height in pixels (sub-panes). When set, pane gets exactly this height. */
  fixedHeight: number | null = null;
  /** Minimum height in pixels */
  minHeight = 50;

  /** When true, autoFitPriceScale is skipped (user has manually zoomed Y-axis) */
  manualScale = false;

  constructor(id: string) {
    this.id = id;
    this.dualCanvas = new DualCanvas();
    this.priceScale = new PriceScale();
  }

  /** Attach canvases to DOM container */
  attach(container: HTMLElement): void {
    this.dualCanvas.attach(container);
  }

  /** Update pane dimensions */
  setRect(rect: Rect): void {
    this.rect = rect;
    this.dualCanvas.resize(rect.width, rect.height);
    this.priceScale.setHeight(rect.height);
  }

  /** Auto-fit price scale to visible data */
  autoFitPriceScale(store: DataStore, visibleRange: VisibleRange): void {
    if (this.manualScale) return;
    const { min, max } = store.getMinMax(visibleRange.from, visibleRange.to);
    this.priceScale.autoFit(min, max);
  }

  /** Reset manual scale so autoFit resumes */
  resetScale(): void {
    this.manualScale = false;
  }

  /** Render main canvas (grid, series, etc.) */
  renderMain(store: DataStore, timeScale: TimeScale, visibleRange: VisibleRange, theme: Theme): void {
    this.dualCanvas.main.clear();
    const ctx = this.dualCanvas.main.ctx;

    const rc: RenderContext = {
      ctx,
      store,
      timeScale,
      priceScale: this.priceScale,
      visibleRange,
      paneRect: { x: 0, y: 0, width: this.rect.width, height: this.rect.height },
      theme,
    };

    for (const renderer of this.mainRenderers) {
      renderer.draw(rc);
    }
  }

  /** Render overlay canvas (crosshair, drawings, etc.) */
  renderOverlay(store: DataStore, timeScale: TimeScale, visibleRange: VisibleRange, theme: Theme): void {
    this.dualCanvas.overlay.clear();
    const ctx = this.dualCanvas.overlay.ctx;

    const rc: RenderContext = {
      ctx,
      store,
      timeScale,
      priceScale: this.priceScale,
      visibleRange,
      paneRect: { x: 0, y: 0, width: this.rect.width, height: this.rect.height },
      theme,
    };

    for (const renderer of this.overlayRenderers) {
      renderer.draw(rc);
    }
  }

  destroy(): void {
    this.dualCanvas.destroy();
  }
}
