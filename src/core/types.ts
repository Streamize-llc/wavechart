/** Raw OHLCV bar data from user input */
export interface BarData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** 2D point in pixel space */
export interface Point {
  x: number;
  y: number;
}

/** Axis-aligned rectangle in pixel space */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Numeric range [from, to] */
export interface Range {
  from: number;
  to: number;
}

/** Visible bar range (integer indices) */
export interface VisibleRange {
  from: number;
  to: number;
}

/** Chart event map for typed event emitter */
export type ChartEventMap = {
  crosshairMove: { barIndex: number; price: number; x: number; y: number };
  click: { barIndex: number; price: number; x: number; y: number };
  visibleRangeChange: { from: number; to: number };
  dataUpdate: void;
  destroy: void;
};

/** Series type identifiers */
export type SeriesType = 'candlestick' | 'line' | 'area' | 'histogram' | 'volume' | 'baseline';
