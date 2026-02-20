import { describe, it, expect } from 'vitest';
import { PriceScale } from '../src/layout/price-scale';

describe('PriceScale', () => {
  it('should convert price to Y and back', () => {
    const ps = new PriceScale();
    ps.setHeight(400);
    ps.setRange(100, 200);

    // Top = max price, Y = 0
    expect(ps.priceToY(200)).toBeCloseTo(0, 0);
    // Bottom = min price, Y = height
    expect(ps.priceToY(100)).toBeCloseTo(400, 0);
    // Middle
    expect(ps.priceToY(150)).toBeCloseTo(200, 0);

    // Round trip
    const y = ps.priceToY(175);
    expect(ps.yToPrice(y)).toBeCloseTo(175, 5);
  });

  it('should auto-fit with padding', () => {
    const ps = new PriceScale();
    ps.setHeight(400);
    ps.autoFit(100, 200);

    // Should have padding, so range is wider than 100-200
    expect(ps.priceMin).toBeLessThan(100);
    expect(ps.priceMax).toBeGreaterThan(200);
  });

  it('should handle flat data', () => {
    const ps = new PriceScale();
    ps.setHeight(400);
    ps.autoFit(100, 100);

    // Should create a small range around 100
    expect(ps.priceMin).toBeLessThan(100);
    expect(ps.priceMax).toBeGreaterThan(100);
  });

  it('should generate tick values', () => {
    const ps = new PriceScale();
    ps.setHeight(400);
    ps.setRange(100, 200);

    const ticks = ps.getTicks(5);
    expect(ticks.length).toBeGreaterThan(0);
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(100);
      expect(t).toBeLessThanOrEqual(200);
    }
  });

  it('should support logarithmic mode', () => {
    const ps = new PriceScale();
    ps.setHeight(400);
    ps.setRange(10, 1000);
    ps.setMode('logarithmic');

    const y10 = ps.priceToY(10);
    const y100 = ps.priceToY(100);
    const y1000 = ps.priceToY(1000);

    // In log mode, 10→100 and 100→1000 should span similar pixel ranges
    const span1 = y10 - y100;
    const span2 = y100 - y1000;
    expect(Math.abs(span1 - span2)).toBeLessThan(1);

    // Round trip
    const price = ps.yToPrice(y100);
    expect(price).toBeCloseTo(100, 0);
  });
});
