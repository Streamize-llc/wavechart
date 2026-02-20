import type { DataStore } from '../model/store';

/** Indicator calculation result */
export interface IndicatorOutput {
  /** Name of this output line */
  name: string;
  /** Computed values (same length as store) */
  data: number[];
  /** Display style */
  style: IndicatorStyle;
}

export interface IndicatorStyle {
  type: 'line' | 'histogram' | 'area';
  color?: string;
  lineWidth?: number;
  positiveColor?: string;
  negativeColor?: string;
}

/** Indicator calculation function signature */
export type IndicatorCalcFn = (store: DataStore, params: Record<string, number>) => IndicatorOutput[];

/** Indicator definition */
export interface IndicatorDef {
  name: string;
  /** Which pane to render in: 'main' for overlay, or a new sub-pane */
  defaultPane: 'main' | 'separate';
  /** Default parameters */
  defaultParams: Record<string, number>;
  /** Calculation function */
  calc: IndicatorCalcFn;
}
