import type { Rect, VisibleRange } from '../core/types';
import type { DataStore } from '../model/store';
import type { TimeScale } from '../layout/time-scale';
import type { PriceScale } from '../layout/price-scale';
import type { Theme } from '../themes/types';

/** Context passed to every renderer's draw() call */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  store: DataStore;
  timeScale: TimeScale;
  priceScale: PriceScale;
  visibleRange: VisibleRange;
  paneRect: Rect;
  theme: Theme;
}

/** All renderers implement this interface */
export interface Renderer {
  /** Draw to canvas. Called within the rAF render cycle. */
  draw(rc: RenderContext): void;
}
