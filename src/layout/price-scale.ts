import { generateTicks } from '../utils/math';

/**
 * Y-axis: converts between price values and Y pixel coordinates.
 * Each pane has its own PriceScale instance.
 */
export class PriceScale {
  /** Width of the price axis area in pixels */
  width = 65;

  private _priceMin = 0;
  private _priceMax = 1;
  private _height = 0;
  private _topPadding = 0.05;
  private _bottomPadding = 0.05;
  private _isLog = false;

  /** Current price range */
  get priceMin(): number { return this._priceMin; }
  get priceMax(): number { return this._priceMax; }
  get height(): number { return this._height; }

  setHeight(height: number): void {
    this._height = height;
  }

  setMode(mode: 'normal' | 'logarithmic'): void {
    this._isLog = mode === 'logarithmic';
  }

  /** Auto-fit price range to data min/max with padding */
  autoFit(dataMin: number, dataMax: number): void {
    if (dataMin >= dataMax) {
      // Handle flat data
      const mid = dataMin || 1;
      dataMin = mid * 0.99;
      dataMax = mid * 1.01;
    }

    const range = dataMax - dataMin;
    this._priceMin = dataMin - range * this._bottomPadding;
    this._priceMax = dataMax + range * this._topPadding;
  }

  /** Set explicit price range */
  setRange(min: number, max: number): void {
    this._priceMin = min;
    this._priceMax = max;
  }

  /** Convert price to Y pixel coordinate */
  priceToY(price: number): number {
    if (this._isLog) {
      const logMin = Math.log(Math.max(this._priceMin, 1e-10));
      const logMax = Math.log(Math.max(this._priceMax, 1e-10));
      const logPrice = Math.log(Math.max(price, 1e-10));
      const ratio = (logPrice - logMin) / (logMax - logMin);
      return this._height * (1 - ratio);
    }

    const range = this._priceMax - this._priceMin;
    if (range === 0) return this._height / 2;
    const ratio = (price - this._priceMin) / range;
    return this._height * (1 - ratio);
  }

  /** Convert Y pixel coordinate to price */
  yToPrice(y: number): number {
    const ratio = 1 - y / this._height;

    if (this._isLog) {
      const logMin = Math.log(Math.max(this._priceMin, 1e-10));
      const logMax = Math.log(Math.max(this._priceMax, 1e-10));
      return Math.exp(logMin + ratio * (logMax - logMin));
    }

    return this._priceMin + ratio * (this._priceMax - this._priceMin);
  }

  /** Shift the price range by a delta (for vertical panning) */
  panVertical(deltaPx: number): void {
    const range = this._priceMax - this._priceMin;
    if (range <= 0 || this._height <= 0) return;
    const deltaPrice = (deltaPx / this._height) * range;
    this._priceMin += deltaPrice;
    this._priceMax += deltaPrice;
  }

  /**
   * Zoom the price range vertically around an anchor price.
   * factor > 1 = zoom in (range shrinks), factor < 1 = zoom out.
   * The anchor price stays at the same Y position on screen.
   */
  zoomVertical(factor: number, anchorPrice: number): void {
    const oldRange = this._priceMax - this._priceMin;
    if (oldRange <= 0) return;
    const newRange = oldRange / factor;
    const ratio = (anchorPrice - this._priceMin) / oldRange;
    this._priceMin = anchorPrice - newRange * ratio;
    this._priceMax = anchorPrice + newRange * (1 - ratio);
  }

  /** Generate nice tick values for the axis */
  getTicks(maxTicks?: number): number[] {
    // Ensure at least 3 candidate slots so short panes (e.g. 140px oscillator)
    // still produce visible labels.
    const max = maxTicks ?? Math.max(3, Math.floor(this._height / 40));
    return generateTicks(this._priceMin, this._priceMax, max);
  }
}
