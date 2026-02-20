import type { Chart } from '../chart';
import { DirtyFlag } from '../core/scheduler';

/** Drag-to-scroll handler (horizontal time pan + vertical price pan) */
export class PanHandler {
  private _chart: Chart;
  private _dragging = false;
  private _lastX = 0;
  private _lastY = 0;

  constructor(chart: Chart) {
    this._chart = chart;
  }

  onMouseDown(e: MouseEvent): void {
    this._dragging = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
  }

  onMouseMove(e: MouseEvent): void {
    if (!this._dragging) return;

    const deltaX = e.clientX - this._lastX;
    const deltaY = e.clientY - this._lastY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;

    // Horizontal pan (time axis)
    const deltaBars = -deltaX / this._chart.viewport.barSpacing;
    this._chart.viewport.scroll(deltaBars, this._chart.store.length);

    // Vertical pan (price axis) — shift all visible panes
    if (deltaY !== 0) {
      this._chart.mainPane.priceScale.panVertical(deltaY);
      this._chart.mainPane.manualScale = true;

      for (const [, pane] of this._chart.subPanes) {
        pane.priceScale.panVertical(deltaY);
        pane.manualScale = true;
      }
    }

    this._chart.scheduler.invalidate(DirtyFlag.MainPane | DirtyFlag.XAxis | DirtyFlag.YAxis | DirtyFlag.Overlay);
  }

  onMouseUp(): void {
    this._dragging = false;
  }

  get isDragging(): boolean {
    return this._dragging;
  }
}
