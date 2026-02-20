import type { Chart } from '../chart';
import { DirtyFlag } from '../core/scheduler';
import { clamp } from '../utils/math';

/** Wheel/pinch zoom handler */
export class ZoomHandler {
  private _chart: Chart;

  constructor(chart: Chart) {
    this._chart = chart;
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();

    const rect = this._chart.wrapper.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    if (e.ctrlKey) {
      // Ctrl+wheel: vertical zoom on the pane under the cursor
      const pane = this._findPaneAtY(localY);
      if (!pane) return;

      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      const paneLocalY = localY - pane.rect.y;
      const anchorPrice = pane.priceScale.yToPrice(paneLocalY);
      pane.priceScale.zoomVertical(factor, anchorPrice);
      pane.manualScale = true;
      this._chart.scheduler.invalidate(DirtyFlag.All);
    } else {
      // Normal wheel: horizontal zoom (existing behavior)
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;

      this._chart.viewport.zoom(factor, localX, this._chart.store.length);
      this._chart.scheduler.invalidate(DirtyFlag.All);
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
}
