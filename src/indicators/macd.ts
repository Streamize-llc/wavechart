import type { DataStore } from '../model/store';
import type { IndicatorOutput } from './types';
import { registerIndicator } from './registry';

function ema(data: Float64Array | number[], length: number): number[] {
  const n = data.length;
  const result = new Array<number>(n).fill(NaN);
  const multiplier = 2 / (length + 1);

  // SMA seed
  let sum = 0;
  for (let i = 0; i < length && i < n; i++) {
    sum += data[i];
  }
  if (n < length) return result;

  let val = sum / length;
  result[length - 1] = val;

  for (let i = length; i < n; i++) {
    val = (data[i] - val) * multiplier + val;
    result[i] = val;
  }

  return result;
}

function calcMACD(store: DataStore, params: Record<string, number>): IndicatorOutput[] {
  const fastLen = params.fastLength ?? 12;
  const slowLen = params.slowLength ?? 26;
  const signalLen = params.signalLength ?? 9;
  const close = store.close;
  const n = store.length;

  const fastEMA = ema(close, fastLen);
  const slowEMA = ema(close, slowLen);

  // MACD line
  const macdLine = new Array<number>(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (isFinite(fastEMA[i]) && isFinite(slowEMA[i])) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }
  }

  // Signal line (EMA of MACD)
  const validMacd = macdLine.filter(isFinite);
  const signalEMA = ema(
    Float64Array.from(macdLine.map(v => isFinite(v) ? v : 0)),
    signalLen
  );

  // Fix: compute signal only from valid MACD values
  const signalLine = new Array<number>(n).fill(NaN);
  const histogram = new Array<number>(n).fill(NaN);

  let firstValid = -1;
  for (let i = 0; i < n; i++) {
    if (isFinite(macdLine[i])) { firstValid = i; break; }
  }

  if (firstValid >= 0) {
    const mult = 2 / (signalLen + 1);
    let sig = 0;
    let count = 0;

    for (let i = firstValid; i < n; i++) {
      if (!isFinite(macdLine[i])) continue;

      if (count < signalLen) {
        sig += macdLine[i];
        count++;
        if (count === signalLen) {
          sig /= signalLen;
          signalLine[i] = sig;
          histogram[i] = macdLine[i] - sig;
        }
      } else {
        sig = (macdLine[i] - sig) * mult + sig;
        signalLine[i] = sig;
        histogram[i] = macdLine[i] - sig;
      }
    }
  }

  return [
    {
      name: 'MACD',
      data: macdLine,
      style: { type: 'line', color: '#2196F3', lineWidth: 1.5 },
    },
    {
      name: 'Signal',
      data: signalLine,
      style: { type: 'line', color: '#FF9800', lineWidth: 1.5 },
    },
    {
      name: 'Histogram',
      data: histogram,
      style: {
        type: 'histogram',
        positiveColor: '#26A69A',
        negativeColor: '#EF5350',
      },
    },
  ];
}

registerIndicator({
  name: 'macd',
  defaultPane: 'separate',
  defaultParams: { fastLength: 12, slowLength: 26, signalLength: 9 },
  calc: calcMACD,
});
