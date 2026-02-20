import type { DataStore } from '../model/store';
import type { IndicatorOutput } from './types';
import { registerIndicator } from './registry';

function calcRSI(store: DataStore, params: Record<string, number>): IndicatorOutput[] {
  const length = params.length ?? 14;
  const close = store.close;
  const n = store.length;
  const result = new Array<number>(n).fill(NaN);

  if (n < length + 1) return [{ name: `RSI(${length})`, data: result, style: { type: 'line', color: '#AB47BC' } }];

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 1; i <= length; i++) {
    const change = close[i] - close[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= length;
  avgLoss /= length;

  result[length] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // RMA smoothing
  for (let i = length + 1; i < n; i++) {
    const change = close[i] - close[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (length - 1) + gain) / length;
    avgLoss = (avgLoss * (length - 1) + loss) / length;

    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return [{
    name: `RSI(${length})`,
    data: result,
    style: {
      type: 'line',
      color: '#AB47BC',
      lineWidth: 1.5,
    },
  }];
}

registerIndicator({
  name: 'rsi',
  defaultPane: 'separate',
  defaultParams: { length: 14 },
  calc: calcRSI,
});
