// Main entry
export { Chart } from './chart';

// Core types
export type { BarData, SeriesType, ChartEventMap, Point, Rect, Range, VisibleRange } from './core/types';

// Options
export type { ChartOptions, SeriesOptions, PaneOptions, LayoutOptions, GridOptions, CrosshairOptions, TimeScaleOptions, PriceScaleOptions } from './model/options';

// Themes
export type { Theme } from './themes/types';
export { darkTheme } from './themes/dark';
export { lightTheme } from './themes/light';

// Data adapters
export type { DataAdapter } from './data/adapter';
export { StaticDataAdapter } from './data/static';
export { RestDataAdapter } from './data/rest';
export type { RestAdapterOptions } from './data/rest';
export { WebSocketDataAdapter } from './data/websocket';
export type { WebSocketAdapterOptions } from './data/websocket';
export { normalizeBarData } from './data/transform';

// Drawings
export type { DrawingType, DataAnchor } from './drawings/drawing';
export { Drawing } from './drawings/drawing';
export { DrawingManager } from './drawings/drawing-manager';
export { TrendlineDrawing } from './drawings/trendline';
export type { TrendlineStyle, TrendlineExtend } from './drawings/trendline';
export { HorizontalLineDrawing } from './drawings/horizontal-line';
export { VerticalLineDrawing } from './drawings/vertical-line';
export { RayDrawing } from './drawings/ray';
export { FibonacciDrawing } from './drawings/fibonacci';
export { RectangleDrawing } from './drawings/rectangle';
export { TextDrawing } from './drawings/text';
export { LabelDrawing } from './drawings/label';
export type { LabelOptions, LabelStyle, LabelYloc } from './drawings/label';
export { BoxDrawing } from './drawings/box';
export type { BoxOptions } from './drawings/box';
export { PolylineDrawing } from './drawings/polyline';
export type { PolylineOptions } from './drawings/polyline';

// Pine plot-level renderers
export { ShapeSeriesRenderer } from './renderers/shape-series';
export type { ShapeSeriesOptions } from './renderers/shape-series';
export { FillBetweenRenderer } from './renderers/fill-between';
export type { FillBetweenOptions } from './renderers/fill-between';
export { PlotArrowRenderer } from './renderers/plot-arrow';
export type { PlotArrowOptions } from './renderers/plot-arrow';
export { PlotCandleRenderer } from './renderers/plot-candle';
export type { PlotCandleOptions } from './renderers/plot-candle';
export { BgColorRenderer } from './renderers/bg-color';
export type { BgColorOptions } from './renderers/bg-color';
export { HLineRenderer } from './renderers/hline';
export type { HLineOptions } from './renderers/hline';
export { PlotLineRenderer } from './renderers/plot-line';
export type { PlotLineOptions, PlotStyle } from './renderers/plot-line';
export type { Renderer, RenderContext } from './renderers/renderer';

// Utilities exposed for integration
export { drawShape, sizeToPx, dashPattern } from './utils/shapes';
export type { PineShape, PineSize } from './utils/shapes';

// DOM overlays (tables)
export { TableOverlay } from './overlays/table';
export type { TableSpec, TableCellSpec, TablePosition } from './overlays/table';

// Indicators
export { registerIndicator, getIndicator, listIndicators } from './indicators/registry';
export type { IndicatorDef, IndicatorOutput, IndicatorCalcFn } from './indicators/types';

// Pine adapter — maps wavealgo-pine /run wire format onto wavechart primitives.
export { applyPineOutput } from './pine/apply';
export type { PineApplyDeps, PineApplyHandle } from './pine/apply';
export type {
  PineRunResponse, PineOutputValue, PinePane,
  PineDrawing, PineLineDrawing, PineLabelDrawing, PineBoxDrawing,
  PinePolylineDrawing, PinePolylinePoint, PineLinefillDrawing,
  PineTableDrawing, PineTableCell,
  PinePlot, PinePlotBase, PinePlotLine, PinePlotShape, PinePlotChar,
  PinePlotArrow, PinePlotCandle, PineHLine, PineFill, PineBgColor,
  PineBarColor, PineStrategy,
} from './pine/types';
