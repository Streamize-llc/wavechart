import type { Renderer, RenderContext } from './renderer';
import { roundToInt } from '../utils/math';

export interface VolumeSeriesOptions {
  upColor?: string;
  downColor?: string;
  /** Height ratio of volume area relative to pane (0-1). Default 0.3 */
  heightRatio?: number;
}

/** Volume overlay renderer (bottom of main pane, bull/bear colors) */
export class VolumeRenderer implements Renderer {
  private _upColor: string;
  private _downColor: string;
  private _heightRatio: number;

  constructor(options: VolumeSeriesOptions = {}) {
    this._upColor = options.upColor ?? 'rgba(38, 166, 154, 0.5)';
    this._downColor = options.downColor ?? 'rgba(239, 83, 80, 0.5)';
    this._heightRatio = options.heightRatio ?? 0.3;
  }

  draw(rc: RenderContext): void {
    const { ctx, store, timeScale, visibleRange, paneRect } = rc;
    const totalBars = store.length;
    if (totalBars === 0) return;

    const maxVolume = store.getMaxVolume(visibleRange.from, visibleRange.to);
    if (maxVolume <= 0) return;

    const barWidth = Math.max(1, timeScale.barWidth * 0.8);
    const halfBar = barWidth / 2;
    const maxHeight = paneRect.height * this._heightRatio;
    const bottomY = paneRect.height;

    const openArr = store.open;
    const closeArr = store.close;
    const volumeArr = store.volume;

    ctx.save();

    // Bull volume
    ctx.fillStyle = this._upColor;
    ctx.beginPath();
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      if (closeArr[i] < openArr[i]) continue;
      const v = volumeArr[i];
      if (v <= 0) continue;

      const x = timeScale.barIndexToX(i, totalBars);
      const h = (v / maxVolume) * maxHeight;
      ctx.rect(
        roundToInt(x - halfBar),
        roundToInt(bottomY - h),
        roundToInt(barWidth),
        roundToInt(h)
      );
    }
    ctx.fill();

    // Bear volume
    ctx.fillStyle = this._downColor;
    ctx.beginPath();
    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      if (closeArr[i] >= openArr[i]) continue;
      const v = volumeArr[i];
      if (v <= 0) continue;

      const x = timeScale.barIndexToX(i, totalBars);
      const h = (v / maxVolume) * maxHeight;
      ctx.rect(
        roundToInt(x - halfBar),
        roundToInt(bottomY - h),
        roundToInt(barWidth),
        roundToInt(h)
      );
    }
    ctx.fill();

    ctx.restore();
  }
}
