import { describe, it, expect } from 'vitest';
import { sizeToPx, dashPattern, drawShape } from '../src/utils/shapes';

describe('sizeToPx', () => {
  it('maps Pine size enum to pixel diameter', () => {
    expect(sizeToPx('tiny')).toBe(6);
    expect(sizeToPx('small')).toBe(8);
    expect(sizeToPx('normal')).toBe(10);
    expect(sizeToPx('large')).toBe(14);
    expect(sizeToPx('huge')).toBe(20);
  });

  it('returns fallback for auto and unknown', () => {
    expect(sizeToPx('auto', 12)).toBe(12);
    expect(sizeToPx(undefined, 15)).toBe(15);
    expect(sizeToPx('custom' as never, 9)).toBe(9);
  });
});

describe('dashPattern', () => {
  it('returns empty array for solid/arrow/unknown', () => {
    expect(dashPattern('solid', 1)).toEqual([]);
    expect(dashPattern('arrow_right', 2)).toEqual([]);
    expect(dashPattern(undefined, 1)).toEqual([]);
  });

  it('scales dashed pattern with line width', () => {
    expect(dashPattern('dashed', 2)).toEqual([8, 4]);
    expect(dashPattern('dashed', 1)).toEqual([6, 4]);
  });

  it('returns dotted pattern', () => {
    expect(dashPattern('dotted', 1)).toEqual([2, 2]);
    expect(dashPattern('dotted', 3)).toEqual([3, 6]);
  });
});

describe('drawShape', () => {
  const makeCtx = () => {
    const calls: string[] = [];
    const stub = new Proxy({}, {
      get: (_t, prop: string) => {
        if (prop === 'save' || prop === 'restore' || prop === 'beginPath' ||
            prop === 'closePath' || prop === 'fill' || prop === 'stroke' ||
            prop === 'moveTo' || prop === 'lineTo' || prop === 'arc' || prop === 'rect') {
          return () => calls.push(prop);
        }
        return () => {};
      },
      set: () => true,
    }) as unknown as CanvasRenderingContext2D;
    return { ctx: stub, calls };
  };

  it('returns true for valid shape names', () => {
    const { ctx } = makeCtx();
    for (const s of ['xcross', 'cross', 'triangleup', 'triangledown', 'flag',
                     'circle', 'arrowup', 'arrowdown', 'square', 'diamond'] as const) {
      expect(drawShape(ctx, s, 10, 10, 10, '#fff')).toBe(true);
    }
  });

  it('returns false for none or unknown', () => {
    const { ctx } = makeCtx();
    expect(drawShape(ctx, 'none', 0, 0, 10, '#fff')).toBe(false);
    expect(drawShape(ctx, 'unknown', 0, 0, 10, '#fff')).toBe(false);
  });
});
