import type { SeriesType } from '../core/types';

/** Top-level chart options */
export interface ChartOptions {
  width?: number;
  height?: number;
  autoSize?: boolean;
  theme?: 'dark' | 'light';
  layout?: LayoutOptions;
  grid?: GridOptions;
  crosshair?: CrosshairOptions;
  timeScale?: TimeScaleOptions;
  priceScale?: PriceScaleOptions;
}

export interface LayoutOptions {
  background?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface GridOptions {
  visible?: boolean;
  color?: string;
  style?: 'solid' | 'dashed';
}

export interface CrosshairOptions {
  visible?: boolean;
  color?: string;
  labelBackground?: string;
  labelTextColor?: string;
}

export interface TimeScaleOptions {
  barSpacing?: number;
  minBarSpacing?: number;
  maxBarSpacing?: number;
  rightOffset?: number;
}

export interface PriceScaleOptions {
  width?: number;
  autoScale?: boolean;
  mode?: 'normal' | 'logarithmic';
}

/** Series display options */
export interface SeriesOptions {
  type?: SeriesType;
  color?: string;
  upColor?: string;
  downColor?: string;
  lineWidth?: number;
  data?: number[];
  priceLineVisible?: boolean;
  baseValue?: number;
  topColor?: string;
  bottomColor?: string;
  topFillColor?: string;
  bottomFillColor?: string;
}

/** Pane configuration */
export interface PaneOptions {
  height?: number;
  minHeight?: number;
}

/** Resolved (all-required) chart options with defaults applied */
export interface ResolvedChartOptions {
  autoSize: boolean;
  layout: Required<LayoutOptions>;
  grid: Required<GridOptions>;
  crosshair: Required<CrosshairOptions>;
  timeScale: Required<TimeScaleOptions>;
  priceScale: Required<PriceScaleOptions>;
}

export function resolveOptions(opts: ChartOptions = {}): ResolvedChartOptions {
  return {
    autoSize: opts.autoSize ?? true,
    layout: {
      background: opts.layout?.background ?? '#131722',
      textColor: opts.layout?.textColor ?? '#B2B5BE',
      fontSize: opts.layout?.fontSize ?? 11,
      fontFamily: opts.layout?.fontFamily ?? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    grid: {
      visible: opts.grid?.visible ?? true,
      color: opts.grid?.color ?? 'rgba(54, 60, 78, 0.5)',
      style: opts.grid?.style ?? 'solid',
    },
    crosshair: {
      visible: opts.crosshair?.visible ?? true,
      color: opts.crosshair?.color ?? 'rgba(150, 150, 150, 0.5)',
      labelBackground: opts.crosshair?.labelBackground ?? '#363C4E',
      labelTextColor: opts.crosshair?.labelTextColor ?? '#B2B5BE',
    },
    timeScale: {
      barSpacing: opts.timeScale?.barSpacing ?? 8,
      minBarSpacing: opts.timeScale?.minBarSpacing ?? 1,
      maxBarSpacing: opts.timeScale?.maxBarSpacing ?? 50,
      rightOffset: opts.timeScale?.rightOffset ?? 5,
    },
    priceScale: {
      width: opts.priceScale?.width ?? 65,
      autoScale: opts.priceScale?.autoScale ?? true,
      mode: opts.priceScale?.mode ?? 'normal',
    },
  };
}
