import { describe, it, expect } from 'vitest';
import { FillBetweenRenderer } from '../src/renderers/fill-between';

describe('FillBetweenRenderer gap handling', () => {
  function makeRc(n: number) {
    const segments: Array<{ first: number; last: number; pointCount: number }> = [];
    let firstX: number | null = null;
    let lastX: number | null = null;
    let pointCount = 0;
    const ctx = {
      save() {}, restore() {},
      beginPath() { firstX = null; lastX = null; pointCount = 0; },
      closePath() {},
      moveTo(x: number) { firstX = x; lastX = x; pointCount = 1; },
      lineTo(x: number) { lastX = x; pointCount++; },
      fill() {
        if (firstX != null && pointCount > 1) {
          segments.push({ first: firstX, last: lastX!, pointCount });
        }
        firstX = null; lastX = null; pointCount = 0;
      },
      createLinearGradient() { return { addColorStop() {} }; },
      set fillStyle(_v: unknown) {},
    } as unknown as CanvasRenderingContext2D;

    return {
      ctx,
      store: { length: n },
      timeScale: { barIndexToX: (i: number) => i },
      priceScale: { priceToY: (v: number) => v },
      visibleRange: { from: 0, to: n - 1 },
      paneRect: { x: 0, y: 0, width: 100, height: 100 },
      theme: {} as never,
      _segments: segments,
    };
  }

  it('skips render when either series is entirely missing', () => {
    const rc = makeRc(3);
    const r = new FillBetweenRenderer({ series1: [1, 2, 3], series2: null });
    r.draw(rc as never);
    expect(rc._segments.length).toBe(0);
  });

  it('creates one fill for a contiguous valid range', () => {
    const rc = makeRc(4);
    const r = new FillBetweenRenderer({
      series1: [1, 2, 3, 4], series2: [0, 0, 0, 0], color: '#FF0000',
    });
    r.draw(rc as never);
    expect(rc._segments.length).toBe(1);
    expect(rc._segments[0].first).toBe(0);
  });

  it('splits into two fills around a shared NaN gap', () => {
    const rc = makeRc(5);
    const r = new FillBetweenRenderer({
      series1: [1, 2, NaN, 4, 5], series2: [0, 0, NaN, 0, 0],
    });
    r.draw(rc as never);
    expect(rc._segments.length).toBe(2);
    expect(rc._segments[0].first).toBe(0);
    expect(rc._segments[1].first).toBe(3);
  });

  it('handles asymmetric NaN without leaking across segments (regression for Fix #3)', () => {
    // s1 valid throughout, s2 has a NaN at bar 2.
    // Expected: ONE fill for bars 0..1, ANOTHER for bars 3..4. Second segment
    // must start at bar 3 — previously it could leak back to bar 0.
    const rc = makeRc(5);
    const r = new FillBetweenRenderer({
      series1: [1, 2, 3, 4, 5], series2: [0, 0, NaN, 0, 0],
    });
    r.draw(rc as never);
    expect(rc._segments.length).toBe(2);
    expect(rc._segments[0].first).toBe(0);
    expect(rc._segments[1].first).toBe(3);
  });

  it('handles asymmetric NaN on s1 side too', () => {
    const rc = makeRc(5);
    const r = new FillBetweenRenderer({
      series1: [1, 2, NaN, 4, 5], series2: [0, 0, 0, 0, 0],
    });
    r.draw(rc as never);
    expect(rc._segments.length).toBe(2);
    expect(rc._segments[1].first).toBe(3);
  });
});
