import type { DataStore } from '../model/store';
import type { IndicatorOutput } from './types';
import { registerIndicator } from './registry';

function calcSMA(store: DataStore, params: Record<string, number>): IndicatorOutput[] {
  const length = params.length ?? 20;
  const close = store.close;
  const n = store.length;
  const result = new Array<number>(n).fill(NaN);

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += close[i];
    if (i >= length) sum -= close[i - length];
    if (i >= length - 1) result[i] = sum / length;
  }

  return [{
    name: `SMA(${length})`,
    data: result,
    style: {
      type: 'line',
      color: params.color !== undefined ? `hsl(${params.color}, 70%, 60%)` : '#2196F3',
      lineWidth: 1.5,
    },
  }];
}

registerIndicator({
  name: 'sma',
  defaultPane: 'main',
  defaultParams: { length: 20 },
  calc: calcSMA,
});
