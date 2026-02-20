import type { DataStore } from '../model/store';
import type { IndicatorOutput } from './types';
import { registerIndicator } from './registry';

function calcBollinger(store: DataStore, params: Record<string, number>): IndicatorOutput[] {
  const length = params.length ?? 20;
  const mult = params.mult ?? 2;
  const close = store.close;
  const n = store.length;

  const middle = new Array<number>(n).fill(NaN);
  const upper = new Array<number>(n).fill(NaN);
  const lower = new Array<number>(n).fill(NaN);

  for (let i = length - 1; i < n; i++) {
    let sum = 0;
    for (let j = i - length + 1; j <= i; j++) sum += close[j];
    const avg = sum / length;

    let sqSum = 0;
    for (let j = i - length + 1; j <= i; j++) {
      const d = close[j] - avg;
      sqSum += d * d;
    }
    const stdev = Math.sqrt(sqSum / length);

    middle[i] = avg;
    upper[i] = avg + mult * stdev;
    lower[i] = avg - mult * stdev;
  }

  return [
    {
      name: `BB Upper`,
      data: upper,
      style: { type: 'line', color: 'rgba(33, 150, 243, 0.5)', lineWidth: 1 },
    },
    {
      name: `BB Middle`,
      data: middle,
      style: { type: 'line', color: '#2196F3', lineWidth: 1 },
    },
    {
      name: `BB Lower`,
      data: lower,
      style: { type: 'line', color: 'rgba(33, 150, 243, 0.5)', lineWidth: 1 },
    },
  ];
}

registerIndicator({
  name: 'bollinger',
  defaultPane: 'main',
  defaultParams: { length: 20, mult: 2 },
  calc: calcBollinger,
});
