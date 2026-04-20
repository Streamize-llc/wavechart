/**
 * Wire format emitted by wavealgo-pine's /run endpoint.
 * Mirrors wavealgo_pine/_serializers.py. Keep in sync with that module.
 */

export interface PineRunResponse {
  success: boolean;
  outputs?: Record<string, PineOutputValue>;
  drawings?: PineDrawing[];
  plots?: PinePlot[];
  panes?: PinePane[];
  strategy?: PineStrategy;
  bars?: number;
  error?: string;
  traceback?: string;
}

export type PineOutputValue =
  | number
  | boolean
  | string
  | null
  | { type: 'series'; data: Array<number | boolean | string | null> };

export interface PinePane {
  id: string;
  overlay: boolean;
  title: string;
}

// --- Drawings ---------------------------------------------------------------

export type PineDrawing =
  | PineLineDrawing
  | PineLabelDrawing
  | PineBoxDrawing
  | PinePolylineDrawing
  | PineLinefillDrawing
  | PineTableDrawing;

export interface PineLineDrawing {
  id: string;
  type: 'line';
  x1: number | null; y1: number | null;
  x2: number | null; y2: number | null;
  xloc: 'bar_index' | 'bar_time';
  extend: 'none' | 'left' | 'right' | 'both';
  style: string;
  width: number;
  color: string;
}

export interface PineLabelDrawing {
  id: string;
  type: 'label';
  x: number | null; y: number | null;
  text: string;
  xloc: 'bar_index' | 'bar_time';
  yloc: 'price' | 'abovebar' | 'belowbar';
  color: string;
  style: string;
  textcolor: string;
  size: string;
  textalign: string;
  tooltip: string;
  text_font_family: string;
}

export interface PineBoxDrawing {
  id: string;
  type: 'box';
  left: number | null; top: number | null;
  right: number | null; bottom: number | null;
  border_color: string;
  bgcolor: string;
  border_width: number;
  border_style: string;
  extend: 'none' | 'left' | 'right' | 'both';
  xloc: 'bar_index' | 'bar_time';
  text: string;
  text_size: string;
  text_color: string;
  text_halign: string;
  text_valign: string;
  text_wrap: string;
  text_font_family: string;
}

export interface PinePolylinePoint {
  index: number | null;
  time: number | null;
  price: number | null;
}

export interface PinePolylineDrawing {
  id: string;
  type: 'polyline';
  points: PinePolylinePoint[];
  curved: boolean;
  closed: boolean;
  xloc: 'bar_index' | 'bar_time';
  line_color: string;
  fill_color: string;
  line_style: string;
  line_width: number;
}

export interface PineLinefillDrawing {
  id: string;
  type: 'linefill';
  line1_id: string | null;
  line2_id: string | null;
  color: string;
}

export interface PineTableCell {
  col: number;
  row: number;
  text: string;
  width: number;
  height: number;
  text_color: string;
  text_halign: string;
  text_valign: string;
  text_size: string;
  bgcolor: string;
  tooltip: string;
  text_font_family: string;
}

export interface PineTableDrawing {
  id: string;
  type: 'table';
  position: string;
  columns: number;
  rows: number;
  bgcolor: string;
  frame_color: string;
  frame_width: number;
  border_color: string;
  border_width: number;
  cells: PineTableCell[];
}

// --- Plots ------------------------------------------------------------------

export interface PinePlotBase {
  id: string;
  kind: string;
  title: string;
  overlay: boolean;
  force_overlay: boolean;
  display: number | string;
  pane: string;
}

export interface PinePlotLine extends PinePlotBase {
  kind: 'plot';
  series: number[] | null;
  color: string | null;
  linewidth: number;
  style: string;
  offset: number;
  histbase: number | null;
  trackprice: boolean;
  join: boolean;
  editable: boolean;
  show_last?: number | null;
}

export interface PinePlotShape extends PinePlotBase {
  kind: 'plotshape';
  condition: Array<number | boolean | null> | null;
  shape: string;
  location: string;
  color: string | null;
  text: string | null;
  textcolor: string | null;
  size: string;
  offset: number;
}

export interface PinePlotChar extends PinePlotBase {
  kind: 'plotchar';
  condition: Array<number | boolean | null> | null;
  char: string;
  location: string;
  color: string | null;
  text: string | null;
  textcolor: string | null;
  size: string;
  offset: number;
}

export interface PinePlotArrow extends PinePlotBase {
  kind: 'plotarrow';
  series: number[] | null;
  colorup: string | null;
  colordown: string | null;
  offset: number;
  minheight: number;
  maxheight: number;
}

export interface PinePlotCandle extends PinePlotBase {
  kind: 'plotcandle' | 'plotbar';
  open: number[] | null;
  high: number[] | null;
  low: number[] | null;
  close: number[] | null;
  color: string | null;
  wickcolor: string | null;
  bordercolor: string | null;
}

export interface PineHLine extends PinePlotBase {
  kind: 'hline';
  price: number | null;
  color: string | null;
  linestyle: string;
  linewidth: number;
  editable: boolean;
}

export interface PineFill extends PinePlotBase {
  kind: 'fill';
  plot1_ref: string | null;
  plot2_ref: string | null;
  series1: number[] | null;
  series2: number[] | null;
  color: string | null;
  top_value: number | null;
  bottom_value: number | null;
  top_color: string | null;
  bottom_color: string | null;
  fillgaps: boolean;
}

export interface PineBgColor extends PinePlotBase {
  kind: 'bgcolor';
  series: Array<string | null> | null;
  color: string | null;
  offset: number;
}

export interface PineBarColor extends PinePlotBase {
  kind: 'barcolor';
  series: Array<string | null> | null;
  color: string | null;
  offset: number;
}

export type PinePlot =
  | PinePlotLine
  | PinePlotShape
  | PinePlotChar
  | PinePlotArrow
  | PinePlotCandle
  | PineHLine
  | PineFill
  | PineBgColor
  | PineBarColor;

// --- Strategy (pass-through; same shape as existing code) ------------------

export interface PineStrategy {
  trades: Array<Record<string, unknown>>;
  open_trades: Array<Record<string, unknown>>;
  equity: number[];
  position_size: number[];
  drawdown: number[];
  initial_capital: number;
  netprofit: number;
  metrics: Record<string, unknown>;
}
