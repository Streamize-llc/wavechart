import type { BarData, ChartEventMap, SeriesType, VisibleRange } from './core/types';
import type { SeriesOptions, PaneOptions, ChartOptions } from './model/options';
import type { Theme } from './themes/types';
import type { Renderer, RenderContext } from './renderers/renderer';
import { EventEmitter } from './core/event-emitter';
import { Scheduler, DirtyFlag } from './core/scheduler';
import { DataStore } from './model/store';
import { Viewport } from './model/viewport';
import { resolveOptions, ResolvedChartOptions } from './model/options';
import { ChartLayout } from './layout/chart-layout';
import { Pane } from './layout/pane';
import { TimeScale } from './layout/time-scale';
import { PriceScale } from './layout/price-scale';
import { GridRenderer } from './renderers/grid';
import { CandlestickRenderer } from './renderers/candlestick';
import { PriceAxisRenderer } from './renderers/price-axis';
import { LineRenderer } from './renderers/line';
import { AreaRenderer } from './renderers/area';
import { HistogramRenderer } from './renderers/histogram';
import { VolumeRenderer } from './renderers/volume';
import { BaselineRenderer } from './renderers/baseline';
import { DrawingManager } from './drawings/drawing-manager';
import type { DrawingType } from './drawings/drawing';
import { getIndicator } from './indicators/registry';
import './indicators/sma';
import './indicators/ema';
import './indicators/rsi';
import './indicators/macd';
import './indicators/bollinger';
import './indicators/volume';
import { darkTheme } from './themes/dark';
import { lightTheme } from './themes/light';
import { CanvasLayer } from './core/canvas-layer';
import { InteractionManager } from './interaction/interaction-manager';
import type { DataAdapter } from './data/adapter';
import { watchDpr } from './utils/dpr';
import { formatPrice, detectPrecision, formatTime, computeTimeWeight, TimeWeight } from './utils/format';
import { roundToPixel } from './utils/math';

/**
 * Main entry point. Creates and manages the entire chart.
 *
 * Usage:
 *   const chart = new Chart(container, { theme: 'dark' })
 *   chart.setData(bars)
 */
export class Chart {
  private readonly _container: HTMLElement;
  private readonly _wrapper: HTMLDivElement;
  private readonly _events = new EventEmitter<ChartEventMap>();
  private readonly _scheduler = new Scheduler();
  private readonly _store = new DataStore();
  private readonly _viewport = new Viewport();
  private readonly _timeScale: TimeScale;
  private readonly _layout: ChartLayout;
  private readonly _options: ResolvedChartOptions;
  private _theme: Theme = darkTheme;

  /** Price axis canvas (shared across panes) */
  private readonly _priceAxisCanvas: CanvasLayer;
  /** Time axis canvas */
  private readonly _timeAxisCanvas: CanvasLayer;

  /** Main price pane */
  private readonly _mainPane: Pane;

  /** Additional panes (for indicators) */
  private readonly _subPanes = new Map<string, Pane>();

  /** Series renderers on the main pane */
  private readonly _series: Array<{ type: SeriesType; renderer: Renderer; options: SeriesOptions }> = [];

  /** Interaction manager */
  private _interaction: InteractionManager | null = null;

  /** Drawing manager */
  private readonly _drawingManager = new DrawingManager();

  /** Data adapter */
  private _dataAdapter: DataAdapter | null = null;

  /** ResizeObserver for autoSize */
  private _resizeObserver: ResizeObserver | null = null;
  private _dprCleanup: (() => void) | null = null;

  /** Crosshair state (set by interaction module) */
  _crosshairX = -1;
  _crosshairY = -1;
  _crosshairBarIndex = -1;
  _crosshairVisible = false;

  /** Precision for price formatting */
  private _pricePrecision = 2;

  private _destroyed = false;

  /** Backend URL for remote indicator computation (wavealgo server) */
  private _backend: string | null = null;

  constructor(container: HTMLElement | string, options?: ChartOptions) {
    // Resolve container
    if (typeof container === 'string') {
      const el = document.getElementById(container);
      if (!el) throw new Error(`Container "${container}" not found`);
      this._container = el;
    } else {
      this._container = container;
    }

    this._options = resolveOptions(options);

    // Apply theme
    if (options?.theme === 'light') {
      this._theme = lightTheme;
    }

    // Create wrapper div
    this._wrapper = document.createElement('div');
    this._wrapper.style.position = 'relative';
    this._wrapper.style.overflow = 'hidden';
    this._wrapper.style.width = '100%';
    this._wrapper.style.height = '100%';
    this._wrapper.style.background = this._theme.background;
    this._wrapper.style.userSelect = 'none';
    this._wrapper.style.cursor = 'crosshair';
    this._container.appendChild(this._wrapper);

    // Configure viewport
    this._viewport.configure({
      barSpacing: this._options.timeScale.barSpacing,
      minBarSpacing: this._options.timeScale.minBarSpacing,
      maxBarSpacing: this._options.timeScale.maxBarSpacing,
      rightOffset: this._options.timeScale.rightOffset,
    });

    // Create time scale
    this._timeScale = new TimeScale(this._viewport);

    // Create layout
    this._layout = new ChartLayout(this._timeScale);

    // Create main pane
    this._mainPane = new Pane('main');
    this._mainPane.mainRenderers.push(new GridRenderer());
    this._mainPane.mainRenderers.push(new CandlestickRenderer());
    this._mainPane.mainRenderers.push(new PriceAxisRenderer());
    this._mainPane.attach(this._wrapper);
    this._layout.addPane(this._mainPane);

    // Interaction manager
    this._interaction = new InteractionManager(this);
    this._mainPane.overlayRenderers.push(this._drawingManager);
    this._mainPane.overlayRenderers.push(this._interaction.crosshair);
    this._mainPane.overlayRenderers.push(this._interaction.tooltip);

    // Price axis canvas
    this._priceAxisCanvas = new CanvasLayer();
    this._priceAxisCanvas.canvas.style.position = 'absolute';
    this._priceAxisCanvas.canvas.style.right = '0';
    this._priceAxisCanvas.canvas.style.top = '0';
    this._priceAxisCanvas.canvas.style.zIndex = '5';
    this._wrapper.appendChild(this._priceAxisCanvas.canvas);

    // Time axis canvas
    this._timeAxisCanvas = new CanvasLayer();
    this._timeAxisCanvas.canvas.style.position = 'absolute';
    this._timeAxisCanvas.canvas.style.left = '0';
    this._timeAxisCanvas.canvas.style.bottom = '0';
    this._timeAxisCanvas.canvas.style.zIndex = '5';
    this._wrapper.appendChild(this._timeAxisCanvas.canvas);

    // Scheduler
    this._scheduler.setRenderCallback((flags) => this._render(flags));

    // AutoSize
    if (this._options.autoSize) {
      this._resizeObserver = new ResizeObserver(() => {
        if (!this._destroyed) this._handleResize();
      });
      this._resizeObserver.observe(this._container);
    }

    // Watch for DPR changes
    this._dprCleanup = watchDpr(() => {
      this._handleResize();
    });

    // Initial size
    if (options?.width && options?.height) {
      this._wrapper.style.width = `${options.width}px`;
      this._wrapper.style.height = `${options.height}px`;
    }
    this._handleResize();
  }

  // ─── Public API ───────────────────────────────────────────

  /** Replace all data */
  setData(bars: BarData[]): void {
    this._store.setData(bars);

    // Detect price precision from close values
    const closes: number[] = [];
    for (let i = 0; i < Math.min(bars.length, 100); i++) {
      closes.push(bars[i].close);
    }
    this._pricePrecision = detectPrecision(closes);

    this._viewport.fitContent(this._store.length);
    this._scheduler.invalidate(DirtyFlag.All);
    this._events.emit('dataUpdate', undefined as never);
  }

  /** Append a new bar */
  appendBar(bar: BarData): void {
    this._store.appendBar(bar);
    this._scheduler.invalidate(DirtyFlag.MainPane | DirtyFlag.XAxis | DirtyFlag.YAxis);
  }

  /** Update the last bar */
  updateBar(bar: Partial<BarData>): void {
    this._store.updateLastBar(bar);
    this._scheduler.invalidate(DirtyFlag.MainPane | DirtyFlag.YAxis);
  }

  /** Connect a data adapter for real-time data */
  setDataAdapter(adapter: DataAdapter): void {
    this._dataAdapter?.disconnect();
    this._dataAdapter = adapter;

    adapter.onHistorical((bars) => this.setData(bars));
    adapter.onBar((bar) => this.appendBar(bar));
    adapter.onUpdate((bar) => this.updateBar(bar));
    adapter.connect();
  }

  /** Subscribe to events */
  on<K extends keyof ChartEventMap>(event: K, listener: (data: ChartEventMap[K]) => void): void {
    this._events.on(event, listener);
  }

  /** Unsubscribe from events */
  off<K extends keyof ChartEventMap>(event: K, listener: (data: ChartEventMap[K]) => void): void {
    this._events.off(event, listener);
  }

  /** Add a sub-pane (for indicators like RSI, MACD) */
  addPane(id: string, options?: PaneOptions): Pane {
    if (this._subPanes.has(id)) {
      return this._subPanes.get(id)!;
    }

    const pane = new Pane(id);
    pane.fixedHeight = options?.height ?? 120;
    if (options?.minHeight) pane.minHeight = options.minHeight;

    pane.mainRenderers.push(new GridRenderer());
    pane.attach(this._wrapper);

    this._subPanes.set(id, pane);
    this._layout.addPane(pane);

    this._handleResize();
    return pane;
  }

  /** Remove a sub-pane */
  removePane(id: string): void {
    if (id === 'main') return;
    const pane = this._subPanes.get(id);
    if (!pane) return;

    this._subPanes.delete(id);
    this._layout.removePane(id);
    this._handleResize();
  }

  /** Add a series to the main pane */
  addSeries(type: SeriesType, options?: SeriesOptions): Renderer {
    let renderer: Renderer;

    switch (type) {
      case 'line':
        renderer = new LineRenderer({
          data: options?.data ?? [],
          color: options?.color,
          lineWidth: options?.lineWidth,
        });
        break;
      case 'area':
        renderer = new AreaRenderer({
          data: options?.data ?? [],
          lineColor: options?.color,
          topColor: options?.topFillColor ?? options?.topColor,
          bottomColor: options?.bottomFillColor ?? options?.bottomColor,
          lineWidth: options?.lineWidth,
        });
        break;
      case 'histogram':
        renderer = new HistogramRenderer({
          data: options?.data ?? [],
          positiveColor: options?.upColor,
          negativeColor: options?.downColor,
        });
        break;
      case 'volume':
        renderer = new VolumeRenderer({
          upColor: options?.upColor,
          downColor: options?.downColor,
        });
        break;
      case 'baseline':
        renderer = new BaselineRenderer({
          data: options?.data ?? [],
          baseValue: options?.baseValue ?? 0,
          topLineColor: options?.upColor,
          bottomLineColor: options?.downColor,
          topFillColor: options?.topFillColor,
          bottomFillColor: options?.bottomFillColor,
          lineWidth: options?.lineWidth,
        });
        break;
      case 'candlestick':
      default:
        renderer = new CandlestickRenderer();
        break;
    }

    this._series.push({ type, renderer, options: options ?? {} });
    this._mainPane.mainRenderers.push(renderer);
    this._scheduler.invalidate(DirtyFlag.MainPane);
    return renderer;
  }

  /** Add an indicator */
  addIndicator(name: string, params?: Record<string, number | string>): void {
    const def = getIndicator(name);
    if (!def) throw new Error(`Unknown indicator: "${name}"`);

    const mergedParams: Record<string, number> = { ...def.defaultParams };
    let targetPane = 'main';

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (k === 'pane') {
          targetPane = String(v);
        } else if (k === 'color') {
          mergedParams[k] = typeof v === 'string' ? 0 : Number(v);
        } else {
          mergedParams[k] = Number(v);
        }
      }
    }

    if (def.defaultPane === 'separate' && targetPane === 'main') {
      targetPane = name;
    }

    // Calculate indicator data
    const outputs = def.calc(this._store, mergedParams);

    // Get or create the target pane
    let pane: Pane;
    if (targetPane === 'main') {
      pane = this._mainPane;
    } else {
      pane = this.addPane(targetPane, { height: 120 });
    }

    // Create renderers for each output
    for (const output of outputs) {
      let renderer: Renderer;

      if (output.style.type === 'line') {
        renderer = new LineRenderer({
          data: output.data,
          color: (params?.color as string) ?? output.style.color,
          lineWidth: output.style.lineWidth,
        });
      } else if (output.style.type === 'histogram') {
        renderer = new HistogramRenderer({
          data: output.data,
          positiveColor: output.style.positiveColor,
          negativeColor: output.style.negativeColor,
        });
      } else {
        renderer = new LineRenderer({
          data: output.data,
          color: output.style.color,
        });
      }

      pane.mainRenderers.push(renderer);
    }

    // For separate panes, set custom price scale range for RSI
    if (name === 'rsi' && targetPane !== 'main') {
      pane.autoFitPriceScale = () => {
        pane.priceScale.setRange(0, 100);
      };
    }

    this._scheduler.invalidate(DirtyFlag.All);
  }

  /** Scroll to a specific bar index */
  scrollTo(barIndex: number): void {
    this._viewport.scrollToBar(barIndex, this._store.length);
    this._scheduler.invalidate(DirtyFlag.All);
  }

  /** Add a drawing programmatically */
  addDrawing(type: DrawingType, options: {
    points?: Array<{ barIndex: number; price: number }>;
    price?: number;
    barIndex?: number;
    text?: string;
    color?: string;
    lineWidth?: number;
  }): void {
    this._drawingManager.addDrawing(type, options);
    this._scheduler.invalidate(DirtyFlag.Overlay);
  }

  /** Set interactive drawing mode */
  setDrawingMode(type: DrawingType | null): void {
    this._drawingManager.drawingMode = type;
    this._wrapper.style.cursor = type ? 'crosshair' : 'crosshair';
  }

  /** Get the drawing manager for advanced usage */
  get drawingManager(): DrawingManager {
    return this._drawingManager;
  }

  /** Fit all data in view and reset manual price scale */
  fitContent(): void {
    this._viewport.fitContent(this._store.length);
    this._mainPane.resetScale();
    for (const pane of this._subPanes.values()) {
      pane.resetScale();
    }
    this._scheduler.invalidate(DirtyFlag.All);
  }

  /** Take a screenshot, returns a canvas element */
  takeScreenshot(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const w = this._layout.containerWidth;
    const h = this._layout.containerHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Draw background
    ctx.fillStyle = this._theme.background;
    ctx.fillRect(0, 0, w, h);

    // Composite all canvases
    for (const pane of this._layout.panes) {
      const r = pane.rect;
      ctx.drawImage(pane.dualCanvas.main.canvas, r.x, r.y, r.width, r.height);
      ctx.drawImage(pane.dualCanvas.overlay.canvas, r.x, r.y, r.width, r.height);
    }

    // Draw axes
    const prRect = this._layout.priceScaleRect;
    ctx.drawImage(this._priceAxisCanvas.canvas, prRect.x, prRect.y, prRect.width, prRect.height);
    const taRect = this._layout.timeAxisRect;
    ctx.drawImage(this._timeAxisCanvas.canvas, taRect.x, taRect.y, taRect.width, taRect.height);

    return canvas;
  }

  /** Destroy the chart and clean up resources */
  destroy(): void {
    this._destroyed = true;
    this._interaction?.destroy();
    this._resizeObserver?.disconnect();
    this._dprCleanup?.();
    this._scheduler.destroy();

    for (const pane of this._layout.panes) {
      pane.destroy();
    }
    this._priceAxisCanvas.destroy();
    this._timeAxisCanvas.destroy();
    this._events.emit('destroy', undefined as never);
    this._events.removeAllListeners();
    this._wrapper.remove();
  }

  /** Set backend URL for remote indicator computation */
  setBackend(url: string): void {
    this._backend = url.replace(/\/$/, '');
  }

  /** Compute an indicator on the wavealgo backend and render it */
  async addRemoteIndicator(name: string, params?: {
    length?: number;
    source?: string;
    pane?: string;
    color?: string;
    [key: string]: unknown;
  }): Promise<void> {
    if (!this._backend) throw new Error('Call setBackend(url) first');

    const { pane: userPane, color, ...indicatorParams } = params ?? {};

    const res = await fetch(`${this._backend}/indicator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ohlcv: this._store.toArray(),
        name,
        params: indicatorParams,
      }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);

    // Determine target pane
    const SEPARATE = new Set([
      'rsi', 'macd', 'stoch', 'cci', 'mfi', 'cmo', 'tsi', 'wpr',
      'dmi', 'mom', 'roc', 'cog', 'rci', 'percentrank',
      'obv', 'pvt', 'accdist', 'vwap',
    ]);
    const targetPane = userPane ?? (SEPARATE.has(name) ? name : 'main');
    if (targetPane !== 'main') {
      this.addPane(targetPane, { height: 120 });
    }

    const pane = targetPane === 'main' ? this._mainPane : this._subPanes.get(targetPane)!;

    if (result.type === 'multi') {
      const DEFAULT_COLORS = ['#2196F3', '#FF9800', '#E91E63', '#4CAF50'];
      let colorIdx = 0;
      for (const [field, data] of Object.entries(result.fields as Record<string, number[]>)) {
        const isHist = field === 'histogram' || field === 'hist';
        const renderer = isHist
          ? new HistogramRenderer({ data: data, positiveColor: '#26A69A', negativeColor: '#EF5350' })
          : new LineRenderer({ data: data, color: color ?? DEFAULT_COLORS[colorIdx++ % 4], lineWidth: 1.5 });
        pane.mainRenderers.push(renderer);
      }
    } else {
      const renderer = new LineRenderer({
        data: result.data,
        color: color ?? '#2196F3',
        lineWidth: 1.5,
      });
      pane.mainRenderers.push(renderer);
    }

    this._scheduler.invalidate(DirtyFlag.All);
  }

  // ─── Accessors for interaction module ─────────────────────

  get store(): DataStore { return this._store; }
  get viewport(): Viewport { return this._viewport; }
  get timeScale(): TimeScale { return this._timeScale; }
  get layout(): ChartLayout { return this._layout; }
  get mainPane(): Pane { return this._mainPane; }
  get scheduler(): Scheduler { return this._scheduler; }
  get events(): EventEmitter<ChartEventMap> { return this._events; }
  get theme(): Theme { return this._theme; }
  get options(): ResolvedChartOptions { return this._options; }
  get wrapper(): HTMLDivElement { return this._wrapper; }
  get pricePrecision(): number { return this._pricePrecision; }
  get subPanes(): Map<string, Pane> { return this._subPanes; }

  // ─── Internal ─────────────────────────────────────────────

  private _handleResize(): void {
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;
    if (w === 0 || h === 0) return;

    this._wrapper.style.width = `${w}px`;
    this._wrapper.style.height = `${h}px`;

    this._layout.resize(w, h, this._options);

    // Position pane canvases
    for (const pane of this._layout.panes) {
      pane.dualCanvas.main.canvas.style.left = `${pane.rect.x}px`;
      pane.dualCanvas.main.canvas.style.top = `${pane.rect.y}px`;
      pane.dualCanvas.overlay.canvas.style.left = `${pane.rect.x}px`;
      pane.dualCanvas.overlay.canvas.style.top = `${pane.rect.y}px`;
    }

    // Resize price axis canvas
    const prRect = this._layout.priceScaleRect;
    this._priceAxisCanvas.resize(prRect.width, prRect.height);
    this._priceAxisCanvas.canvas.style.left = `${prRect.x}px`;
    this._priceAxisCanvas.canvas.style.top = `${prRect.y}px`;

    // Resize time axis canvas
    const taRect = this._layout.timeAxisRect;
    this._timeAxisCanvas.resize(taRect.width, taRect.height);
    this._timeAxisCanvas.canvas.style.left = `${taRect.x}px`;
    this._timeAxisCanvas.canvas.style.top = `${taRect.y}px`;

    this._scheduler.forceRender();
  }

  private _render(flags: number): void {
    if (this._store.length === 0) return;

    const visibleRange = this._timeScale.getVisibleRange(this._store);

    // Auto-fit price scale
    if (flags & (DirtyFlag.MainPane | DirtyFlag.YAxis | DirtyFlag.Layout)) {
      this._mainPane.autoFitPriceScale(this._store, visibleRange);

      // Auto-fit sub-panes
      for (const pane of this._subPanes.values()) {
        pane.autoFitPriceScale(this._store, visibleRange);
      }
    }

    // Main canvas rendering
    if (flags & (DirtyFlag.MainPane | DirtyFlag.Layout)) {
      for (const pane of this._layout.panes) {
        pane.renderMain(this._store, this._timeScale, visibleRange, this._theme);
      }
    }

    // Overlay canvas rendering
    if (flags & (DirtyFlag.Overlay | DirtyFlag.Layout)) {
      for (const pane of this._layout.panes) {
        pane.renderOverlay(this._store, this._timeScale, visibleRange, this._theme);
      }
    }

    // Price axis
    if (flags & (DirtyFlag.YAxis | DirtyFlag.MainPane | DirtyFlag.Layout)) {
      this._renderPriceAxis(visibleRange);
    }

    // Time axis
    if (flags & (DirtyFlag.XAxis | DirtyFlag.MainPane | DirtyFlag.Layout)) {
      this._renderTimeAxis(visibleRange);
    }
  }

  private _renderPriceAxis(visibleRange: VisibleRange): void {
    this._priceAxisCanvas.clear();
    const ctx = this._priceAxisCanvas.ctx;
    const rect = this._layout.priceScaleRect;
    const ps = this._mainPane.priceScale;

    // Background
    ctx.fillStyle = this._theme.background;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Border
    ctx.strokeStyle = this._theme.priceScale.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0.5, 0);
    ctx.lineTo(0.5, rect.height);
    ctx.stroke();

    // Labels
    ctx.fillStyle = this._theme.priceScale.textColor;
    ctx.font = `${this._theme.fontSize}px ${this._theme.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ticks = ps.getTicks();
    for (const price of ticks) {
      const y = ps.priceToY(price);
      if (y >= 0 && y <= this._mainPane.rect.height) {
        ctx.fillText(
          formatPrice(price, this._pricePrecision),
          rect.width - 8,
          y
        );
      }
    }

    // Current price tag (last close)
    if (this._store.length > 0) {
      const lastClose = this._store.close[this._store.length - 1];
      const lastOpen = this._store.open[this._store.length - 1];
      const isBull = lastClose >= lastOpen;
      const tagY = ps.priceToY(lastClose);

      if (tagY >= 0 && tagY <= this._mainPane.rect.height) {
        const text = formatPrice(lastClose, this._pricePrecision);
        const textWidth = ctx.measureText(text).width;
        const tagH = 18;
        const tagW = textWidth + 12;

        ctx.fillStyle = isBull ? this._theme.candle.upColor : this._theme.candle.downColor;
        ctx.fillRect(4, tagY - tagH / 2, tagW, tagH);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText(text, 10, tagY);
        ctx.textAlign = 'right';
      }
    }
  }

  private _renderTimeAxis(visibleRange: VisibleRange): void {
    this._timeAxisCanvas.clear();
    const ctx = this._timeAxisCanvas.ctx;
    const rect = this._layout.timeAxisRect;
    const totalBars = this._store.length;

    // Background
    ctx.fillStyle = this._theme.background;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Border
    ctx.strokeStyle = this._theme.timeScale.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.lineTo(rect.width, 0.5);
    ctx.stroke();

    // Labels
    ctx.fillStyle = this._theme.timeScale.textColor;
    ctx.font = `${this._theme.fontSize}px ${this._theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const timeArr = this._store.time;
    const minLabelSpacing = 80;
    let lastLabelX = -minLabelSpacing;

    for (let i = visibleRange.from; i <= visibleRange.to; i++) {
      const x = this._timeScale.barIndexToX(i, totalBars);
      if (x < 0 || x > rect.width) continue;

      const prev = i > 0 ? timeArr[i - 1] : null;
      const weight = computeTimeWeight(timeArr[i], prev);

      // Only show labels at significant time boundaries with minimum spacing
      if (weight >= TimeWeight.Hour && x - lastLabelX >= minLabelSpacing) {
        const text = formatTime(timeArr[i], weight);
        ctx.fillText(text, x, rect.height / 2);
        lastLabelX = x;
      }
    }
  }
}
