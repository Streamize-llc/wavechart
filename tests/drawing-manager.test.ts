import { describe, it, expect } from 'vitest';
import { DrawingManager } from '../src/drawings/drawing-manager';
import { LabelDrawing } from '../src/drawings/label';
import { BoxDrawing } from '../src/drawings/box';
import { PolylineDrawing } from '../src/drawings/polyline';
import { TrendlineDrawing } from '../src/drawings/trendline';

describe('DrawingManager programmatic creation', () => {
  it('creates a label with Pine style + anchor', () => {
    const m = new DrawingManager();
    const d = m.addDrawing('label', {
      barIndex: 10, price: 100,
      text: 'hello',
      label: { yloc: 'abovebar', bgcolor: '#FF5252', style: 'label_down', textcolor: '#FFFFFF' },
    }) as LabelDrawing;
    expect(d).toBeInstanceOf(LabelDrawing);
    expect(d.text).toBe('hello');
    expect(d.bgcolor).toBe('#FF5252');
    expect(d.style).toBe('label_down');
    expect(m.drawings).toHaveLength(1);
  });

  it('creates a box with border/bg/text', () => {
    const m = new DrawingManager();
    const d = m.addDrawing('box', {
      points: [{ barIndex: 0, price: 105 }, { barIndex: 10, price: 100 }],
      box: {
        borderColor: '#000',
        bgcolor: 'rgba(255,0,0,0.2)',
        borderStyle: 'dashed',
        text: 'zone',
        textHalign: 'left',
      },
    }) as BoxDrawing;
    expect(d).toBeInstanceOf(BoxDrawing);
    expect(d.borderStyle).toBe('dashed');
    expect(d.text).toBe('zone');
    expect(d.textHalign).toBe('left');
  });

  it('creates a polyline with curved/closed', () => {
    const m = new DrawingManager();
    const d = m.addDrawing('polyline', {
      points: [
        { barIndex: 0, price: 1 },
        { barIndex: 5, price: 3 },
        { barIndex: 10, price: 2 },
      ],
      polyline: { curved: true, closed: true, lineColor: '#2962FF', fillColor: 'rgba(41,98,255,0.1)' },
    }) as PolylineDrawing;
    expect(d).toBeInstanceOf(PolylineDrawing);
    expect(d.curved).toBe(true);
    expect(d.closed).toBe(true);
    expect(d.anchors).toHaveLength(3);
  });

  it('creates a trendline with Pine extend + style', () => {
    const m = new DrawingManager();
    const d = m.addDrawing('trendline', {
      points: [{ barIndex: 0, price: 100 }, { barIndex: 10, price: 110 }],
      style: 'arrow_right',
      extend: 'right',
      color: '#4CAF50',
      lineWidth: 2,
    }) as TrendlineDrawing;
    expect(d.style).toBe('arrow_right');
    expect(d.extend).toBe('right');
    expect(d.lineWidth).toBe(2);
  });

  it('preserves undo/redo for new drawing types', () => {
    const m = new DrawingManager();
    m.addDrawing('label', { barIndex: 0, price: 0, text: 'x' });
    expect(m.drawings).toHaveLength(1);
    m.undo();
    expect(m.drawings).toHaveLength(0);
    m.redo();
    expect(m.drawings).toHaveLength(1);
  });

  it('rejects linefill through addDrawing (rendered as renderer instead)', () => {
    const m = new DrawingManager();
    expect(() => m.addDrawing('linefill', {})).toThrow(/FillBetweenRenderer/);
  });
});
