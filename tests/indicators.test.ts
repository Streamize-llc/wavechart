import { describe, it, expect } from 'vitest';
import { DataStore } from '../src/model/store';
import { getIndicator } from '../src/indicators/registry';
import '../src/indicators/sma';
import '../src/indicators/ema';
import '../src/indicators/rsi';
import '../src/indicators/macd';
import '../src/indicators/bollinger';

function makeStore(closes: number[]): DataStore {
  const store = new DataStore();
  store.setData(closes.map((c, i) => ({
    time: i, open: c, high: c + 1, low: c - 1, close: c,
  })));
  return store;
}

describe('SMA indicator', () => {
  it('should calculate correctly', () => {
    const store = makeStore([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const def = getIndicator('sma')!;
    const outputs = def.calc(store, { length: 3 });

    expect(outputs).toHaveLength(1);
    expect(outputs[0].name).toBe('SMA(3)');
    expect(outputs[0].data[2]).toBeCloseTo(2, 5); // (1+2+3)/3
    expect(outputs[0].data[9]).toBeCloseTo(9, 5); // (8+9+10)/3
    expect(isNaN(outputs[0].data[0])).toBe(true);
    expect(isNaN(outputs[0].data[1])).toBe(true);
  });
});

describe('EMA indicator', () => {
  it('should calculate correctly', () => {
    const store = makeStore([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const def = getIndicator('ema')!;
    const outputs = def.calc(store, { length: 3 });

    expect(outputs).toHaveLength(1);
    expect(outputs[0].name).toBe('EMA(3)');
    // First value should be SMA seed
    expect(outputs[0].data[2]).toBeCloseTo(2, 0);
    expect(isNaN(outputs[0].data[0])).toBe(true);
  });
});

describe('RSI indicator', () => {
  it('should calculate values between 0 and 100', () => {
    const closes = [];
    for (let i = 0; i < 50; i++) closes.push(100 + Math.sin(i * 0.3) * 10);
    const store = makeStore(closes);
    const def = getIndicator('rsi')!;
    const outputs = def.calc(store, { length: 14 });

    expect(outputs).toHaveLength(1);
    for (let i = 14; i < 50; i++) {
      const v = outputs[0].data[i];
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('MACD indicator', () => {
  it('should return 3 outputs', () => {
    const closes = [];
    for (let i = 0; i < 50; i++) closes.push(100 + i * 0.5);
    const store = makeStore(closes);
    const def = getIndicator('macd')!;
    const outputs = def.calc(store, { fastLength: 12, slowLength: 26, signalLength: 9 });

    expect(outputs).toHaveLength(3);
    expect(outputs[0].name).toBe('MACD');
    expect(outputs[1].name).toBe('Signal');
    expect(outputs[2].name).toBe('Histogram');
  });
});

describe('Bollinger indicator', () => {
  it('should return 3 bands', () => {
    const closes = [];
    for (let i = 0; i < 30; i++) closes.push(100 + Math.random() * 10);
    const store = makeStore(closes);
    const def = getIndicator('bollinger')!;
    const outputs = def.calc(store, { length: 20, mult: 2 });

    expect(outputs).toHaveLength(3);
    // Upper > Middle > Lower
    for (let i = 19; i < 30; i++) {
      expect(outputs[0].data[i]).toBeGreaterThan(outputs[1].data[i]); // upper > middle
      expect(outputs[1].data[i]).toBeGreaterThan(outputs[2].data[i]); // middle > lower
    }
  });
});
