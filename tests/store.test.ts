import { describe, it, expect } from 'vitest';
import { DataStore } from '../src/model/store';

describe('DataStore', () => {
  it('should set and get data', () => {
    const store = new DataStore();
    store.setData([
      { time: 1, open: 10, high: 15, low: 5, close: 12, volume: 100 },
      { time: 2, open: 12, high: 18, low: 8, close: 16, volume: 200 },
    ]);

    expect(store.length).toBe(2);
    expect(store.getBar(0)).toEqual({
      time: 1, open: 10, high: 15, low: 5, close: 12, volume: 100,
    });
    expect(store.getBar(1)?.close).toBe(16);
  });

  it('should append bars', () => {
    const store = new DataStore();
    store.setData([
      { time: 1, open: 10, high: 15, low: 5, close: 12 },
    ]);
    store.appendBar({ time: 2, open: 12, high: 18, low: 8, close: 16 });

    expect(store.length).toBe(2);
    expect(store.getBar(1)?.time).toBe(2);
  });

  it('should update last bar', () => {
    const store = new DataStore();
    store.setData([
      { time: 1, open: 10, high: 15, low: 5, close: 12 },
    ]);
    store.updateLastBar({ close: 14, high: 20 });

    const bar = store.getBar(0);
    expect(bar?.close).toBe(14);
    expect(bar?.high).toBe(20);
    expect(bar?.open).toBe(10); // Unchanged
  });

  it('should compute min/max', () => {
    const store = new DataStore();
    store.setData([
      { time: 1, open: 10, high: 15, low: 3, close: 12 },
      { time: 2, open: 12, high: 20, low: 8, close: 16 },
      { time: 3, open: 16, high: 18, low: 6, close: 10 },
    ]);

    const { min, max } = store.getMinMax(0, 2);
    expect(min).toBe(3);
    expect(max).toBe(20);
  });

  it('should return null for out-of-range getBar', () => {
    const store = new DataStore();
    store.setData([{ time: 1, open: 10, high: 15, low: 5, close: 12 }]);
    expect(store.getBar(-1)).toBeNull();
    expect(store.getBar(1)).toBeNull();
  });

  it('should handle growing beyond initial capacity', () => {
    const store = new DataStore();
    store.setData([]);

    for (let i = 0; i < 300; i++) {
      store.appendBar({ time: i, open: i, high: i + 1, low: i - 1, close: i + 0.5 });
    }

    expect(store.length).toBe(300);
    expect(store.getBar(299)?.time).toBe(299);
  });

  it('should provide Float64Array views', () => {
    const store = new DataStore();
    store.setData([
      { time: 1, open: 10, high: 15, low: 5, close: 12, volume: 100 },
      { time: 2, open: 12, high: 18, low: 8, close: 16, volume: 200 },
    ]);

    expect(store.time).toBeInstanceOf(Float64Array);
    expect(store.time.length).toBe(2);
    expect(store.close[0]).toBe(12);
    expect(store.close[1]).toBe(16);
  });
});
