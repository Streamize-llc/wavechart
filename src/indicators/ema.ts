import type { DataStore } from '../model/store';
import type { IndicatorOutput } from './types';
import { registerIndicator } from './registry';

function calcEMA(store: DataStore, params: Record<string, number>): IndicatorOutput[] {
  const length = params.length ?? 20;
  const close = store.close;
  const n = store.length;
  const result = new Array<number>(n).fill(NaN);

  const multiplier = 2 / (length + 1);
  let ema = 0;

  for (let i = 0; i < n; i++) {
    if (i < length - 1) {
      ema += close[i];
      if (i === length - 2) ema = ema / (length - 1); // will be used next iter
    } else if (i === length - 1) {
      // First EMA = SMA of first `length` bars
      ema = ((ema * (length - 1)) + close[i]) / length;
      result[i] = ema;
    } else {
      ema = (close[i] - ema) * multiplier + ema;
      result[i] = ema;
    }
  }

  return [{
    name: `EMA(${length})`,
    data: result,
    style: {
      type: 'line',
      color: '#FF9800',
      lineWidth: 1.5,
    },
  }];
}

registerIndicator({
  name: 'ema',
  defaultPane: 'main',
  defaultParams: { length: 20 },
  calc: calcEMA,
});
