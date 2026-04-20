/**
 * Pine → wavechart dispatcher.
 *
 * Takes the `{drawings, plots, panes}` block of a wavealgo-pine `/run`
 * response and applies it to a Chart instance. Owns no state beyond the
 * TableOverlay it creates for the current response.
 */

import type { Chart } from '../chart';
import { PlotLineRenderer } from '../renderers/plot-line';
import { ShapeSeriesRenderer } from '../renderers/shape-series';
import { FillBetweenRenderer } from '../renderers/fill-between';
import { BgColorRenderer } from '../renderers/bg-color';
import { HLineRenderer } from '../renderers/hline';
import { PlotArrowRenderer } from '../renderers/plot-arrow';
import { PlotCandleRenderer } from '../renderers/plot-candle';
import { TableOverlay } from '../overlays/table';
import type {
  PineRunResponse, PinePlot, PineDrawing,
  PineLineDrawing, PineLabelDrawing, PineBoxDrawing,
  PinePolylineDrawing, PineLinefillDrawing, PineTableDrawing,
  PinePlotLine, PinePlotShape, PinePlotChar, PinePlotArrow,
  PineHLine, PineFill, PineBgColor, PineBarColor, PinePlotCandle,
} from './types';

export interface PineApplyDeps {
  chart: Chart;
  /** Root element for DOM overlays (tables). Usually the chart's container. */
  container: HTMLElement;
}

export interface PineApplyHandle {
  /** Clean up DOM overlays created by applyPineOutput. */
  destroy(): void;
}

const DEFAULT_COLOR = '#2196F3';

export function applyPineOutput(
  deps: PineApplyDeps,
  result: Pick<PineRunResponse, 'drawings' | 'plots' | 'panes'>,
): PineApplyHandle {
  const { chart, container } = deps;

  // 1) Create panes declared by the backend (sub_* ids). Main pane always exists.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const paneMap = new Map<string, any>();
  paneMap.set('main', chart.mainPane);
  for (const p of result.panes ?? []) {
    if (p.id === 'main') continue;
    paneMap.set(p.id, chart.addPane(p.id, { height: 140 }));
  }

  // 2) Index plots by id so fill() can resolve plot refs to series arrays.
  const plotById = new Map<string, PinePlot>();
  for (const p of result.plots ?? []) plotById.set(p.id, p);

  // 3) Dispatch plots onto their target pane. Respect Pine's display flag:
  //    plots with display=display.none (0) or "none" are still registered in
  //    plotById (so fill() can reference their series) but not rendered.
  for (const plot of result.plots ?? []) {
    if (!isPlotVisible(plot)) continue;
    const pane = paneMap.get(plot.pane) ?? chart.mainPane;
    dispatchPlot(plot, pane, chart, plotById);
  }

  // 3a) Sub-panes default to OHLCV-based auto-fit, which is wrong for
  // oscillators like RSI/MACD whose y-range is unrelated to price. Override
  // each non-main pane's autoFitPriceScale to scan its own Pine data.
  for (const paneSpec of result.panes ?? []) {
    if (paneSpec.id === 'main') continue;
    const pane = paneMap.get(paneSpec.id);
    if (!pane) continue;
    const range = collectPaneDataRange(result.plots ?? [], paneSpec.id);
    if (!range) continue;
    const pad = Math.max(1, (range.max - range.min) * 0.08);
    const lo = range.min - pad;
    const hi = range.max + pad;
    pane.autoFitPriceScale = () => pane.priceScale.setRange(lo, hi);
  }

  // 4) Dispatch drawings — lines/labels/boxes/polylines to DrawingManager;
  //    linefills become FillBetweenRenderer; tables become DOM overlay.
  const drawingById = new Map<string, PineDrawing>();
  for (const d of result.drawings ?? []) drawingById.set(d.id, d);

  const tableSpecs: any[] = [];
  for (const d of result.drawings ?? []) {
    switch (d.type) {
      case 'line':     addLineDrawing(chart, d); break;
      case 'label':    addLabelDrawing(chart, d); break;
      case 'box':      addBoxDrawing(chart, d); break;
      case 'polyline': addPolylineDrawing(chart, d); break;
      case 'linefill': addLinefillRenderer(chart, d, drawingById); break;
      case 'table':    tableSpecs.push(convertTableSpec(d)); break;
    }
  }

  let tableOverlay: TableOverlay | null = null;
  if (tableSpecs.length > 0) {
    tableOverlay = new TableOverlay(container);
    tableOverlay.render(tableSpecs);
  }

  return {
    destroy() {
      if (tableOverlay) tableOverlay.destroy();
    },
  };
}

// ---------------------------------------------------------------------------
// Plot dispatchers
// ---------------------------------------------------------------------------

function dispatchPlot(
  plot: PinePlot,
  pane: any,
  chart: Chart,
  plotById: Map<string, PinePlot>,
): void {
  switch (plot.kind) {
    case 'plot':        return addPlotLine(pane, plot);
    case 'plotshape':   return addPlotShape(pane, plot);
    case 'plotchar':    return addPlotChar(pane, plot);
    case 'plotarrow':   return addPlotArrow(pane, plot);
    case 'plotcandle':
    case 'plotbar':     return addPlotCandle(pane, plot);
    case 'hline':       return addHLine(pane, plot);
    case 'fill':        return addFill(pane, plot, plotById);
    case 'bgcolor':     return addBgColor(pane, plot);
    case 'barcolor':    return addBarColor(chart, plot);
  }
}

function addPlotLine(pane: any, plot: PinePlotLine): void {
  if (!plot.series || plot.series.length === 0) return;
  pane.mainRenderers.push(new PlotLineRenderer({
    data: plot.series.map(safeNum),
    style: plot.style as any,
    color: plot.color ?? DEFAULT_COLOR,
    lineWidth: plot.linewidth,
    histbase: plot.histbase ?? 0,
    offset: plot.offset,
  }));
}

function addPlotShape(pane: any, plot: PinePlotShape): void {
  if (!plot.condition) return;
  pane.mainRenderers.push(new ShapeSeriesRenderer({
    condition: plot.condition,
    shape: plot.shape as any,
    location: plot.location as any,
    color: plot.color ?? undefined,
    text: plot.text ?? undefined,
    textcolor: plot.textcolor ?? undefined,
    size: plot.size as any,
    offset: plot.offset,
  }));
}

function addPlotChar(pane: any, plot: PinePlotChar): void {
  if (!plot.condition) return;
  pane.mainRenderers.push(new ShapeSeriesRenderer({
    condition: plot.condition,
    char: plot.char,
    location: plot.location as any,
    color: plot.color ?? undefined,
    text: plot.text ?? undefined,
    textcolor: plot.textcolor ?? undefined,
    size: plot.size as any,
    offset: plot.offset,
  }));
}

function addPlotArrow(pane: any, plot: PinePlotArrow): void {
  if (!plot.series) return;
  pane.mainRenderers.push(new PlotArrowRenderer({
    values: plot.series,
    colorUp: plot.colorup ?? undefined,
    colorDown: plot.colordown ?? undefined,
    minHeight: plot.minheight,
    maxHeight: plot.maxheight,
    offset: plot.offset,
  }));
}

function addPlotCandle(pane: any, plot: PinePlotCandle): void {
  if (!plot.open || !plot.high || !plot.low || !plot.close) return;
  pane.mainRenderers.push(new PlotCandleRenderer({
    open: plot.open, high: plot.high, low: plot.low, close: plot.close,
    color: plot.color ?? undefined,
    wickColor: plot.wickcolor ?? undefined,
    borderColor: plot.bordercolor ?? undefined,
    style: plot.kind === 'plotbar' ? 'bar' : 'candle',
  }));
}

function addHLine(pane: any, plot: PineHLine): void {
  if (plot.price == null) return;
  pane.mainRenderers.push(new HLineRenderer({
    price: plot.price,
    color: plot.color ?? '#787B86',
    linestyle: plot.linestyle as any,
    linewidth: plot.linewidth,
    label: plot.title || undefined,
  }));
}

function addFill(
  pane: any,
  plot: PineFill,
  plotById: Map<string, PinePlot>,
): void {
  let s1 = plot.series1;
  let s2 = plot.series2;
  if (!s1 && plot.plot1_ref) s1 = seriesFromPlot(plotById.get(plot.plot1_ref));
  if (!s2 && plot.plot2_ref) s2 = seriesFromPlot(plotById.get(plot.plot2_ref));
  let c1: number | null = null, c2: number | null = null;
  if (plot.plot1_ref && !s1) c1 = constantFromPlot(plotById.get(plot.plot1_ref));
  if (plot.plot2_ref && !s2) c2 = constantFromPlot(plotById.get(plot.plot2_ref));
  if (!s1 && !s2 && c1 == null && c2 == null) return;

  pane.mainRenderers.push(new FillBetweenRenderer({
    series1: s1 ? s1.map(safeNum) : null,
    series2: s2 ? s2.map(safeNum) : null,
    constant1: c1, constant2: c2,
    color: plot.color ?? undefined,
    topValue: plot.top_value,
    bottomValue: plot.bottom_value,
    topColor: plot.top_color,
    bottomColor: plot.bottom_color,
  }));
}

function addBgColor(pane: any, plot: PineBgColor): void {
  const colors = plot.series ?? null;
  pane.mainRenderers.push(new BgColorRenderer({
    colors: colors ?? undefined,
    uniform: colors ? undefined : plot.color,
    offset: plot.offset,
  }));
}

function addBarColor(chart: Chart, plot: PineBarColor): void {
  const renderers = chart.mainPane.mainRenderers as Array<any>;
  for (const r of renderers) {
    if (typeof r.setColorOverride === 'function') {
      const colors = plot.series
        ? plot.series.map((c) => c ?? null)
        : plot.color ? new Array(chart.store.length).fill(plot.color) : null;
      r.setColorOverride(colors);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Drawing dispatchers
// ---------------------------------------------------------------------------

function addLineDrawing(chart: Chart, d: PineLineDrawing): void {
  if (d.x1 == null || d.y1 == null || d.x2 == null || d.y2 == null) return;
  const b1 = resolveX(d.x1, d.xloc, chart);
  const b2 = resolveX(d.x2, d.xloc, chart);
  chart.addDrawing('trendline', {
    points: [
      { barIndex: b1, price: d.y1 },
      { barIndex: b2, price: d.y2 },
    ],
    color: d.color || undefined,
    lineWidth: d.width,
    style: d.style as any,
    extend: d.extend as any,
  } as any);
}

function addLabelDrawing(chart: Chart, d: PineLabelDrawing): void {
  if (d.x == null || d.y == null) return;
  const highs: number[] = sliceArr((chart.store as any)?.high);
  const lows: number[] = sliceArr((chart.store as any)?.low);
  const bx = resolveX(d.x, d.xloc, chart);
  chart.addDrawing('label', {
    barIndex: bx, price: d.y, text: d.text,
    label: {
      yloc: d.yloc,
      bgcolor: d.color || undefined,
      textcolor: d.textcolor || undefined,
      size: d.size,
      textalign: (d.textalign as any) || 'center',
      style: d.style as any,
      tooltip: d.tooltip,
      highSeries: highs,
      lowSeries: lows,
    },
  } as any);
}

function addBoxDrawing(chart: Chart, d: PineBoxDrawing): void {
  if (d.left == null || d.right == null || d.top == null || d.bottom == null) return;
  const bl = resolveX(d.left, d.xloc, chart);
  const br = resolveX(d.right, d.xloc, chart);
  chart.addDrawing('box', {
    points: [
      { barIndex: bl, price: d.top },
      { barIndex: br, price: d.bottom },
    ],
    box: {
      borderColor: d.border_color || undefined,
      bgcolor: d.bgcolor || undefined,
      borderWidth: d.border_width,
      borderStyle: d.border_style,
      extend: d.extend,
      text: d.text,
      textSize: d.text_size,
      textColor: d.text_color || undefined,
      textHalign: (d.text_halign as any) || 'center',
      textValign: (d.text_valign as any) || 'center',
    },
  } as any);
}

function addPolylineDrawing(chart: Chart, d: PinePolylineDrawing): void {
  const timeArr = sliceArr((chart.store as any)?.time);
  const pts = d.points
    .map((p) => {
      let barIndex: number;
      if (p.index != null && Number.isFinite(p.index)) {
        barIndex = p.index;
      } else if (p.time != null && d.xloc === 'bar_time') {
        barIndex = timeToBarIndex(p.time, timeArr);
      } else {
        barIndex = 0;
      }
      return { barIndex, price: p.price ?? 0 };
    })
    .filter((p) => Number.isFinite(p.barIndex) && Number.isFinite(p.price));
  if (pts.length < 2) return;
  chart.addDrawing('polyline', {
    points: pts,
    polyline: {
      lineColor: d.line_color || undefined,
      fillColor: d.fill_color || undefined,
      lineStyle: d.line_style,
      lineWidth: d.line_width,
      curved: d.curved,
      closed: d.closed,
    },
  } as any);
}

function addLinefillRenderer(
  chart: Chart,
  d: PineLinefillDrawing,
  drawingById: Map<string, PineDrawing>,
): void {
  const l1 = d.line1_id ? drawingById.get(d.line1_id) : null;
  const l2 = d.line2_id ? drawingById.get(d.line2_id) : null;
  if (!l1 || l1.type !== 'line' || !l2 || l2.type !== 'line') return;
  const total = chart.store.length;
  const s1 = interpolateLine(l1 as PineLineDrawing, total);
  const s2 = interpolateLine(l2 as PineLineDrawing, total);
  chart.mainPane.mainRenderers.push(new FillBetweenRenderer({
    series1: s1, series2: s2,
    color: d.color || undefined,
  }));
}

function convertTableSpec(d: PineTableDrawing) {
  return {
    id: d.id,
    position: d.position,
    columns: d.columns,
    rows: d.rows,
    bgcolor: d.bgcolor || undefined,
    frameColor: d.frame_color || undefined,
    frameWidth: d.frame_width,
    borderColor: d.border_color || undefined,
    borderWidth: d.border_width,
    cells: d.cells.map((c) => ({
      col: c.col, row: c.row, text: c.text,
      width: c.width, height: c.height,
      textColor: c.text_color || undefined,
      bgcolor: c.bgcolor || undefined,
      textHalign: (c.text_halign as any) || 'center',
      textValign: (c.text_valign as any) || 'center',
      textSize: c.text_size,
      tooltip: c.tooltip,
    })),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pine's `display` bitmask: 0 = none, 65535 = all (default). */
function isPlotVisible(plot: PinePlot): boolean {
  const d = plot.display;
  if (typeof d === 'number') return d !== 0;
  if (typeof d === 'string') return d !== 'none' && d !== 'display.none';
  return true;
}

/** Scan every Pine plot assigned to `paneId` and return its y-range. */
function collectPaneDataRange(
  plots: PinePlot[],
  paneId: string,
): { min: number; max: number } | null {
  let min = Infinity, max = -Infinity;
  const observe = (v: unknown): void => {
    if (typeof v === 'number' && Number.isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  };
  const scanSeries = (arr: Array<number | boolean | string | null> | null | undefined): void => {
    if (!arr) return;
    for (const v of arr) {
      if (typeof v === 'number') observe(v);
      else if (typeof v === 'boolean') observe(v ? 1 : 0);
    }
  };
  for (const p of plots) {
    if (p.pane !== paneId) continue;
    if (!isPlotVisible(p)) continue;
    switch (p.kind) {
      case 'plot':       scanSeries(p.series); break;
      case 'hline':      observe(p.price); break;
      case 'fill':
        scanSeries(p.series1); scanSeries(p.series2);
        observe(p.top_value); observe(p.bottom_value);
        break;
      case 'plotcandle':
      case 'plotbar':
        scanSeries(p.open); scanSeries(p.high); scanSeries(p.low); scanSeries(p.close);
        break;
      case 'plotshape':
      case 'plotchar':
        // markers ride on bar prices via location — irrelevant for sub-panes.
        break;
      case 'plotarrow': scanSeries(p.series); break;
    }
  }
  if (min === Infinity) return null;
  if (min === max) { min -= 1; max += 1; }
  return { min, max };
}

function safeNum(v: number | boolean | string | null): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return NaN;
}

function seriesFromPlot(p: PinePlot | undefined): number[] | null {
  if (!p) return null;
  if (p.kind === 'plot' && p.series) return p.series;
  if (p.kind === 'plotshape' && p.condition) return p.condition.map((v) => (v ? 1 : NaN));
  if ((p.kind === 'plotcandle' || p.kind === 'plotbar') && p.close) return p.close;
  return null;
}

function constantFromPlot(p: PinePlot | undefined): number | null {
  if (!p) return null;
  if (p.kind === 'hline') return p.price;
  return null;
}

function sliceArr(arr: unknown): number[] {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr as number[];
  if (typeof (arr as any).length === 'number') {
    const len = (arr as any).length;
    const out = new Array<number>(len);
    for (let i = 0; i < len; i++) out[i] = (arr as any)[i];
    return out;
  }
  return [];
}

function resolveX(x: number, xloc: string, chart: Chart): number {
  if (xloc !== 'bar_time') return x;
  const timeArr = sliceArr((chart.store as any)?.time);
  return timeToBarIndex(x, timeArr);
}

function timeToBarIndex(t: number, timeArr: number[]): number {
  const n = timeArr.length;
  if (n === 0) return 0;
  if (t <= timeArr[0]) return 0;
  if (t >= timeArr[n - 1]) return n - 1;
  let lo = 0, hi = n - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (timeArr[mid] <= t) lo = mid; else hi = mid;
  }
  return Math.abs(timeArr[lo] - t) <= Math.abs(timeArr[hi] - t) ? lo : hi;
}

function interpolateLine(line: PineLineDrawing, total: number): number[] {
  const out = new Array<number>(total).fill(NaN);
  if (line.x1 == null || line.y1 == null || line.x2 == null || line.y2 == null) return out;
  const x1 = Math.max(0, Math.round(line.x1));
  const x2 = Math.min(total - 1, Math.round(line.x2));
  if (x2 < x1) return out;
  const dx = line.x2 - line.x1;
  for (let i = x1; i <= x2; i++) {
    const t = dx === 0 ? 0 : (i - line.x1) / dx;
    out[i] = line.y1 + (line.y2 - line.y1) * t;
  }
  if (line.extend === 'left' || line.extend === 'both') {
    for (let i = 0; i < x1; i++) out[i] = line.y1;
  }
  if (line.extend === 'right' || line.extend === 'both') {
    for (let i = x2 + 1; i < total; i++) out[i] = line.y2;
  }
  return out;
}
