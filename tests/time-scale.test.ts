import { describe, it, expect } from 'vitest';
import { Viewport } from '../src/model/viewport';

describe('Viewport', () => {
  it('should compute visible range', () => {
    const vp = new Viewport();
    vp.configure({ barSpacing: 8, rightOffset: 5 });
    vp.setChartWidth(800);

    const range = vp.computeVisibleRange(500);
    expect(range.from).toBeGreaterThanOrEqual(0);
    expect(range.to).toBeLessThanOrEqual(499);
    expect(range.to - range.from).toBeGreaterThan(0);
  });

  it('should convert barIndex to X and back', () => {
    const vp = new Viewport();
    vp.configure({ barSpacing: 10, rightOffset: 5 });
    vp.setChartWidth(800);

    const x = vp.barIndexToX(100, 500);
    const barIndex = vp.xToBarIndex(x, 500);
    expect(barIndex).toBeCloseTo(100, 5);
  });

  it('should zoom changing bar spacing', () => {
    const vp = new Viewport();
    vp.configure({ barSpacing: 8, minBarSpacing: 1, maxBarSpacing: 50, rightOffset: 5 });
    vp.setChartWidth(800);

    vp.zoom(1.5, 400, 500);

    expect(vp.barSpacing).toBe(12); // 8 * 1.5
  });

  it('should clamp bar spacing', () => {
    const vp = new Viewport();
    vp.configure({ barSpacing: 8, minBarSpacing: 2, maxBarSpacing: 40 });
    vp.setChartWidth(800);

    vp.zoom(100, 400, 500);
    expect(vp.barSpacing).toBe(40);

    vp.zoom(0.01, 400, 500);
    expect(vp.barSpacing).toBe(2);
  });

  it('should fit content', () => {
    const vp = new Viewport();
    vp.configure({ barSpacing: 8, minBarSpacing: 1, maxBarSpacing: 50, rightOffset: 5 });
    vp.setChartWidth(800);

    vp.fitContent(100);

    // After fit, visible range should include most bars
    // rightOffset=5 means last visible bar is index 94
    const range = vp.computeVisibleRange(100);
    expect(range.from).toBeLessThanOrEqual(5);
    expect(range.to).toBeGreaterThanOrEqual(90);
  });
});
