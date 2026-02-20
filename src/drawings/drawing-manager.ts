import type { Renderer, RenderContext } from '../renderers/renderer';
import type { DrawingType, DataAnchor } from './drawing';
import { Drawing } from './drawing';
import { TrendlineDrawing } from './trendline';
import { HorizontalLineDrawing } from './horizontal-line';
import { VerticalLineDrawing } from './vertical-line';
import { RayDrawing } from './ray';
import { FibonacciDrawing } from './fibonacci';
import { RectangleDrawing } from './rectangle';
import { TextDrawing } from './text';

interface UndoAction {
  type: 'add' | 'remove' | 'move';
  drawing: Drawing;
  prevAnchors?: DataAnchor[];
}

/**
 * Manages drawing lifecycle: create, select, move, delete, undo/redo.
 * Implements the Renderer interface so it can be added to a pane's overlay renderers.
 */
export class DrawingManager implements Renderer {
  private _drawings: Drawing[] = [];
  private _nextId = 1;
  private _selected: Drawing | null = null;
  private _undoStack: UndoAction[] = [];
  private _redoStack: UndoAction[] = [];

  /** Current drawing mode (null = selection mode) */
  drawingMode: DrawingType | null = null;

  /** Pending anchors for the current drawing being created */
  private _pendingAnchors: DataAnchor[] = [];

  get drawings(): readonly Drawing[] {
    return this._drawings;
  }

  get selectedDrawing(): Drawing | null {
    return this._selected;
  }

  /** Create and add a drawing programmatically */
  addDrawing(type: DrawingType, options: {
    points?: DataAnchor[];
    price?: number;
    barIndex?: number;
    text?: string;
    color?: string;
    lineWidth?: number;
  }): Drawing {
    const id = `drawing_${this._nextId++}`;
    let drawing: Drawing;

    switch (type) {
      case 'trendline':
        drawing = new TrendlineDrawing(
          id,
          options.points as [DataAnchor, DataAnchor],
          options.color,
          options.lineWidth
        );
        break;
      case 'horizontal-line':
        drawing = new HorizontalLineDrawing(id, options.price ?? 0, options.color, options.lineWidth);
        break;
      case 'vertical-line':
        drawing = new VerticalLineDrawing(id, options.barIndex ?? 0, options.color, options.lineWidth);
        break;
      case 'ray':
        drawing = new RayDrawing(
          id,
          options.points as [DataAnchor, DataAnchor],
          options.color,
          options.lineWidth
        );
        break;
      case 'fibonacci':
        drawing = new FibonacciDrawing(id, options.points as [DataAnchor, DataAnchor], options.color);
        break;
      case 'rectangle':
        drawing = new RectangleDrawing(id, options.points as [DataAnchor, DataAnchor], options.color);
        break;
      case 'text':
        drawing = new TextDrawing(
          id,
          options.points?.[0] ?? { barIndex: options.barIndex ?? 0, price: options.price ?? 0 },
          options.text ?? '',
          options.color
        );
        break;
      default:
        throw new Error(`Unknown drawing type: ${type}`);
    }

    this._drawings.push(drawing);
    this._undoStack.push({ type: 'add', drawing });
    this._redoStack.length = 0;
    return drawing;
  }

  /** Remove a drawing */
  removeDrawing(id: string): void {
    const idx = this._drawings.findIndex((d) => d.id === id);
    if (idx < 0) return;

    const drawing = this._drawings[idx];
    this._drawings.splice(idx, 1);

    if (this._selected === drawing) this._selected = null;

    this._undoStack.push({ type: 'remove', drawing });
    this._redoStack.length = 0;
  }

  /** Select a drawing by hit test */
  selectAt(px: number, py: number, timeScale: any, priceScale: any, totalBars: number): Drawing | null {
    if (this._selected) {
      this._selected.selected = false;
      this._selected = null;
    }

    // Search in reverse (topmost first)
    for (let i = this._drawings.length - 1; i >= 0; i--) {
      if (this._drawings[i].hitTest(px, py, timeScale, priceScale, totalBars)) {
        this._selected = this._drawings[i];
        this._selected.selected = true;
        return this._selected;
      }
    }

    return null;
  }

  /** Handle click for drawing creation (returns true if handled) */
  handleClick(barIndex: number, price: number): boolean {
    if (!this.drawingMode) return false;

    this._pendingAnchors.push({ barIndex, price });

    const needed = this._anchorsNeeded(this.drawingMode);
    if (this._pendingAnchors.length >= needed) {
      this.addDrawing(this.drawingMode, {
        points: this._pendingAnchors.slice(),
        price: this._pendingAnchors[0].price,
        barIndex: this._pendingAnchors[0].barIndex,
      });
      this._pendingAnchors = [];
      this.drawingMode = null;
      return true;
    }

    return true;
  }

  /** Delete selected drawing */
  deleteSelected(): void {
    if (this._selected) {
      this.removeDrawing(this._selected.id);
    }
  }

  /** Undo last action */
  undo(): void {
    const action = this._undoStack.pop();
    if (!action) return;

    switch (action.type) {
      case 'add':
        this._drawings = this._drawings.filter((d) => d !== action.drawing);
        break;
      case 'remove':
        this._drawings.push(action.drawing);
        break;
      case 'move':
        if (action.prevAnchors) {
          action.drawing.anchors = action.prevAnchors.map((a) => ({ ...a }));
        }
        break;
    }

    this._redoStack.push(action);
  }

  /** Redo last undone action */
  redo(): void {
    const action = this._redoStack.pop();
    if (!action) return;

    switch (action.type) {
      case 'add':
        this._drawings.push(action.drawing);
        break;
      case 'remove':
        this._drawings = this._drawings.filter((d) => d !== action.drawing);
        break;
    }

    this._undoStack.push(action);
  }

  /** Render all drawings on the overlay canvas */
  draw(rc: RenderContext): void {
    const { ctx, timeScale, priceScale, paneRect } = rc;
    const totalBars = rc.store.length;

    for (const drawing of this._drawings) {
      drawing.render(ctx, timeScale, priceScale, totalBars, paneRect.width, paneRect.height);
    }
  }

  private _anchorsNeeded(type: DrawingType): number {
    switch (type) {
      case 'horizontal-line':
      case 'vertical-line':
      case 'text':
        return 1;
      case 'trendline':
      case 'ray':
      case 'fibonacci':
      case 'rectangle':
        return 2;
      default:
        return 2;
    }
  }
}
