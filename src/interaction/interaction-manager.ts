import type { Chart } from '../chart';
import { DirtyFlag } from '../core/scheduler';
import { PanHandler } from './pan';
import { ZoomHandler } from './zoom';
import { PriceScaleDragHandler } from './price-scale-drag';
import { CrosshairRenderer } from './crosshair';
import { TooltipRenderer } from './tooltip';

/**
 * Central interaction manager: binds mouse/touch/wheel events
 * and routes them to appropriate handlers.
 */
export class InteractionManager {
  private _chart: Chart;
  private _pan: PanHandler;
  private _zoom: ZoomHandler;
  private _priceScaleDrag: PriceScaleDragHandler;
  readonly crosshair: CrosshairRenderer;
  readonly tooltip: TooltipRenderer;

  private _boundMouseDown: (e: MouseEvent) => void;
  private _boundMouseMove: (e: MouseEvent) => void;
  private _boundMouseUp: (e: MouseEvent) => void;
  private _boundMouseLeave: (e: MouseEvent) => void;
  private _boundWheel: (e: WheelEvent) => void;
  private _boundTouchStart: (e: TouchEvent) => void;
  private _boundTouchMove: (e: TouchEvent) => void;
  private _boundTouchEnd: (e: TouchEvent) => void;
  private _boundDblClick: (e: MouseEvent) => void;
  private _boundKeyDown: (e: KeyboardEvent) => void;

  constructor(chart: Chart) {
    this._chart = chart;
    this._pan = new PanHandler(chart);
    this._zoom = new ZoomHandler(chart);
    this._priceScaleDrag = new PriceScaleDragHandler(chart);
    this.crosshair = new CrosshairRenderer(chart);
    this.tooltip = new TooltipRenderer(chart);

    // Bind events
    const el = chart.wrapper;

    // Enable keyboard focus
    el.tabIndex = 0;
    el.style.outline = 'none';

    this._boundMouseDown = (e) => this._onMouseDown(e);
    this._boundMouseMove = (e) => this._onMouseMove(e);
    this._boundMouseUp = () => this._onMouseUp();
    this._boundMouseLeave = () => this._onMouseLeave();
    this._boundWheel = (e) => this._zoom.onWheel(e);
    this._boundTouchStart = (e) => this._onTouchStart(e);
    this._boundTouchMove = (e) => this._onTouchMove(e);
    this._boundTouchEnd = () => this._onTouchEnd();
    this._boundDblClick = (e) => this._onDblClick(e);
    this._boundKeyDown = (e) => this._onKeyDown(e);

    el.addEventListener('mousedown', this._boundMouseDown);
    el.addEventListener('mousemove', this._boundMouseMove);
    el.addEventListener('mouseup', this._boundMouseUp);
    el.addEventListener('mouseleave', this._boundMouseLeave);
    el.addEventListener('wheel', this._boundWheel, { passive: false });
    el.addEventListener('touchstart', this._boundTouchStart, { passive: false });
    el.addEventListener('touchmove', this._boundTouchMove, { passive: false });
    el.addEventListener('touchend', this._boundTouchEnd);
    el.addEventListener('dblclick', this._boundDblClick);
    el.addEventListener('keydown', this._boundKeyDown);
  }

  private _getLocalPos(e: MouseEvent): { x: number; y: number } {
    const rect = this._chart.wrapper.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private _onMouseDown(e: MouseEvent): void {
    const pos = this._getLocalPos(e);
    const chartAreaWidth = this._chart.layout.chartAreaWidth;

    if (pos.x >= chartAreaWidth) {
      // Price axis area: start vertical zoom drag
      const pane = this._findPaneAtY(pos.y);
      if (pane) {
        this._priceScaleDrag.onMouseDown(e, pane);
        this._chart.wrapper.style.cursor = 'ns-resize';
      }
    } else {
      // Chart area: start horizontal pan
      this._pan.onMouseDown(e);
      this._chart.wrapper.style.cursor = 'grabbing';
    }
  }

  private _onMouseMove(e: MouseEvent): void {
    const pos = this._getLocalPos(e);
    const chartAreaWidth = this._chart.layout.chartAreaWidth;

    if (this._pan.isDragging) {
      this._pan.onMouseMove(e);
    }

    // Update cursor for price axis hover
    if (!this._pan.isDragging && !this._priceScaleDrag.isDragging) {
      if (pos.x >= chartAreaWidth) {
        this._chart.wrapper.style.cursor = 'ns-resize';
      } else {
        this._chart.wrapper.style.cursor = 'crosshair';
      }
    }

    // Update crosshair if in chart area
    if (pos.x >= 0 && pos.x < chartAreaWidth &&
        pos.y >= 0 && pos.y < this._chart.layout.chartAreaHeight) {
      this.crosshair.updatePosition(pos.x, pos.y);

      // Emit crosshair event
      const totalBars = this._chart.store.length;
      if (totalBars > 0) {
        const barIndex = this._chart._crosshairBarIndex;
        const price = this._chart.mainPane.priceScale.yToPrice(pos.y);
        this._chart.events.emit('crosshairMove', { barIndex, price, x: pos.x, y: pos.y });
      }
    }
  }

  private _onMouseUp(): void {
    this._pan.onMouseUp();
    this._chart.wrapper.style.cursor = 'crosshair';
  }

  private _onMouseLeave(): void {
    this._pan.onMouseUp();
    this.crosshair.hide();
    this._chart.wrapper.style.cursor = 'crosshair';
  }

  private _onDblClick(_e: MouseEvent): void {
    this._chart.fitContent();
  }

  private _onKeyDown(e: KeyboardEvent): void {
    const totalBars = this._chart.store.length;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this._chart.viewport.scroll(-3, totalBars);
        this._chart.scheduler.invalidate(DirtyFlag.All);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this._chart.viewport.scroll(3, totalBars);
        this._chart.scheduler.invalidate(DirtyFlag.All);
        break;
      case '+':
      case '=':
        e.preventDefault();
        this._chart.viewport.zoom(1.2, this._chart.layout.chartAreaWidth / 2, totalBars);
        this._chart.scheduler.invalidate(DirtyFlag.All);
        break;
      case '-':
        e.preventDefault();
        this._chart.viewport.zoom(0.8, this._chart.layout.chartAreaWidth / 2, totalBars);
        this._chart.scheduler.invalidate(DirtyFlag.All);
        break;
      case 'Home':
        e.preventDefault();
        this._chart.fitContent();
        break;
    }
  }

  /** Find which pane contains the given Y coordinate */
  private _findPaneAtY(y: number) {
    for (const pane of this._chart.layout.panes) {
      if (y >= pane.rect.y && y < pane.rect.y + pane.rect.height) {
        return pane;
      }
    }
    return null;
  }

  // ─── Touch events ─────────────────────────────────────────

  private _touchStartX = 0;
  private _touchStartY = 0;
  private _pinchStartDist = 0;

  private _onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
      this._pan.onMouseDown({ clientX: this._touchStartX } as MouseEvent);
    } else if (e.touches.length === 2) {
      e.preventDefault();
      this._pinchStartDist = this._getTouchDist(e.touches[0], e.touches[1]);
    }
  }

  private _onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this._pan.onMouseMove({ clientX: touch.clientX } as MouseEvent);

      const rect = this._chart.wrapper.getBoundingClientRect();
      this.crosshair.updatePosition(
        touch.clientX - rect.left,
        touch.clientY - rect.top
      );
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dist = this._getTouchDist(e.touches[0], e.touches[1]);
      const factor = dist / this._pinchStartDist;
      this._pinchStartDist = dist;

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const rect = this._chart.wrapper.getBoundingClientRect();
      this._chart.viewport.zoom(factor, midX - rect.left, this._chart.store.length);
      this._chart.scheduler.invalidate(0x3F); // DirtyFlag.All
    }
  }

  private _onTouchEnd(): void {
    this._pan.onMouseUp();
  }

  private _getTouchDist(a: Touch, b: Touch): number {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  destroy(): void {
    const el = this._chart.wrapper;
    el.removeEventListener('mousedown', this._boundMouseDown);
    el.removeEventListener('mousemove', this._boundMouseMove);
    el.removeEventListener('mouseup', this._boundMouseUp);
    el.removeEventListener('mouseleave', this._boundMouseLeave);
    el.removeEventListener('wheel', this._boundWheel);
    el.removeEventListener('touchstart', this._boundTouchStart);
    el.removeEventListener('touchmove', this._boundTouchMove);
    el.removeEventListener('touchend', this._boundTouchEnd);
    el.removeEventListener('dblclick', this._boundDblClick);
    el.removeEventListener('keydown', this._boundKeyDown);
  }
}
