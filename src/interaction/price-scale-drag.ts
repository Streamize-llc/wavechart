import type { Chart } from '../chart';
import { DirtyFlag } from '../core/scheduler';
import type { Pane } from '../layout/pane';

/**
 * Handles vertical drag on the price axis area for manual Y-axis zoom.
 * Dragging up = zoom in, dragging down = zoom out.
 * Uses document-level mousemove/mouseup (same pattern as Separator).
 */
export class PriceScaleDragHandler {
  private _chart: Chart;
  private _dragging = false;
  private _lastY = 0;
  private _targetPane: Pane | null = null;

  constructor(chart: Chart) {
    this._chart = chart;
  }

  get isDragging(): boolean {
    return this._dragging;
  }

  onMouseDown(e: MouseEvent, pane: Pane): void {
    this._dragging = true;
    this._lastY = e.clientY;
    this._targetPane = pane;

    const onMouseMove = (ev: MouseEvent) => {
      if (!this._dragging || !this._targetPane) return;

      const deltaY = ev.clientY - this._lastY;
      this._lastY = ev.clientY;

      // Convert pixel delta to zoom factor
      // Moving mouse up (negative deltaY) = zoom in = factor > 1
      const factor = 1 - deltaY * 0.005;
      const midPrice = (this._targetPane.priceScale.priceMin + this._targetPane.priceScale.priceMax) / 2;
      this._targetPane.priceScale.zoomVertical(factor, midPrice);
      this._targetPane.manualScale = true;
      this._chart.scheduler.invalidate(DirtyFlag.All);
    };

    const onMouseUp = () => {
      this._dragging = false;
      this._targetPane = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}
