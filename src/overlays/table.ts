/**
 * Pine `table.new()` rendered as an absolute-positioned DOM table overlay.
 *
 * Tables live outside the Canvas2D rendering loop — drawing text in canvas
 * requires manual layout that would duplicate HTML table. Using DOM keeps
 * cells selectable/accessible and avoids re-implementing text metrics.
 */

export type TablePosition =
  | 'top_left' | 'top_center' | 'top_right'
  | 'middle_left' | 'middle_center' | 'middle_right'
  | 'bottom_left' | 'bottom_center' | 'bottom_right';

export interface TableCellSpec {
  col: number;
  row: number;
  text?: string;
  width?: number;        // percentage of table width
  height?: number;
  textColor?: string;
  bgcolor?: string;
  textHalign?: 'left' | 'center' | 'right';
  textValign?: 'top' | 'center' | 'bottom';
  textSize?: string;
  tooltip?: string;
}

export interface TableSpec {
  id: string;
  position: TablePosition;
  columns: number;
  rows: number;
  bgcolor?: string;
  frameColor?: string;
  frameWidth?: number;
  borderColor?: string;
  borderWidth?: number;
  cells: TableCellSpec[];
}

// Insets clear the chart's right-side price axis (~56px) and bottom time axis
// (~28px) so tables don't overlap axis labels. These are conservative defaults
// for the typical right-aligned price scale layout.
const AXIS_RIGHT = 56;
const AXIS_BOTTOM = 28;
const EDGE_PAD = 8;

const POSITION_STYLES: Record<TablePosition, Partial<CSSStyleDeclaration>> = {
  top_left:      { top: `${EDGE_PAD}px`, left: `${EDGE_PAD}px`, transform: '' },
  top_center:    { top: `${EDGE_PAD}px`, left: '50%',           transform: 'translateX(-50%)' },
  top_right:     { top: `${EDGE_PAD}px`, right: `${AXIS_RIGHT}px`, transform: '' },
  middle_left:   { top: '50%',           left: `${EDGE_PAD}px`, transform: 'translateY(-50%)' },
  middle_center: { top: '50%',           left: '50%',           transform: 'translate(-50%, -50%)' },
  middle_right:  { top: '50%',           right: `${AXIS_RIGHT}px`, transform: 'translateY(-50%)' },
  bottom_left:   { bottom: `${AXIS_BOTTOM}px`, left: `${EDGE_PAD}px`, transform: '' },
  bottom_center: { bottom: `${AXIS_BOTTOM}px`, left: '50%',           transform: 'translateX(-50%)' },
  bottom_right:  { bottom: `${AXIS_BOTTOM}px`, right: `${AXIS_RIGHT}px`, transform: '' },
};

const TEXT_SIZES: Record<string, string> = {
  tiny: '9px',
  small: '10px',
  normal: '12px',
  large: '14px',
  huge: '18px',
  auto: '12px',
};

/**
 * Manages one or more <table> elements pinned to a chart container.
 * Call `render(specs)` to reconcile the displayed set with the new specs.
 */
export class TableOverlay {
  private readonly _container: HTMLElement;
  private _wrapper: HTMLDivElement | null = null;
  private _tables = new Map<string, HTMLTableElement>();

  constructor(container: HTMLElement) {
    this._container = container;
  }

  /** Replace all currently displayed tables with `specs`. */
  render(specs: TableSpec[]): void {
    this._ensureWrapper();
    const wrapper = this._wrapper!;
    const seen = new Set<string>();

    for (const spec of specs) {
      seen.add(spec.id);
      let el = this._tables.get(spec.id);
      if (!el) {
        el = document.createElement('table');
        el.setAttribute('data-wc-table', spec.id);
        wrapper.appendChild(el);
        this._tables.set(spec.id, el);
      }
      this._applyTable(el, spec);
    }

    // Remove stale tables
    for (const [id, el] of this._tables) {
      if (!seen.has(id)) {
        el.remove();
        this._tables.delete(id);
      }
    }
  }

  /** Remove all tables. */
  clear(): void {
    for (const el of this._tables.values()) el.remove();
    this._tables.clear();
  }

  destroy(): void {
    this.clear();
    this._wrapper?.remove();
    this._wrapper = null;
  }

  private _ensureWrapper(): void {
    if (this._wrapper) return;
    const w = document.createElement('div');
    w.style.position = 'absolute';
    w.style.inset = '0';
    w.style.pointerEvents = 'none';
    w.style.zIndex = '10';
    this._container.appendChild(w);
    this._wrapper = w;
  }

  private _applyTable(el: HTMLTableElement, spec: TableSpec): void {
    const pos = POSITION_STYLES[spec.position] ?? POSITION_STYLES.top_right;
    el.style.position = 'absolute';
    el.style.pointerEvents = 'auto';
    el.style.top = ''; el.style.bottom = ''; el.style.left = ''; el.style.right = '';
    el.style.transform = '';
    Object.assign(el.style, pos);

    el.style.borderCollapse = 'collapse';
    // Default a slightly opaque dark background so cells without explicit
    // bgcolor remain readable against busy chart backgrounds.
    el.style.background = spec.bgcolor || 'rgba(13, 12, 11, 0.85)';
    el.style.backdropFilter = 'blur(2px)';
    (el.style as any).webkitBackdropFilter = 'blur(2px)';
    el.style.border = spec.frameWidth && spec.frameColor
      ? `${spec.frameWidth}px solid ${spec.frameColor}`
      : '1px solid rgba(255,255,255,0.08)';
    el.style.font = `12px sans-serif`;
    el.style.color = '#FFFFFF';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';

    // Rebuild the cell grid — simpler than diffing.
    while (el.firstChild) el.removeChild(el.firstChild);
    const tbody = document.createElement('tbody');
    el.appendChild(tbody);

    // Index cells by (row, col) for O(1) lookup.
    const cellMap = new Map<string, TableCellSpec>();
    for (const c of spec.cells) cellMap.set(`${c.row}:${c.col}`, c);

    for (let r = 0; r < spec.rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < spec.columns; c++) {
        const td = document.createElement('td');
        const cell = cellMap.get(`${r}:${c}`);
        td.style.padding = '3px 6px';
        if (spec.borderWidth && spec.borderColor) {
          td.style.border = `${spec.borderWidth}px solid ${spec.borderColor}`;
        }
        if (cell) {
          td.textContent = cell.text ?? '';
          if (cell.bgcolor) td.style.background = cell.bgcolor;
          if (cell.textColor) td.style.color = cell.textColor;
          if (cell.textSize) td.style.fontSize = TEXT_SIZES[cell.textSize] ?? TEXT_SIZES.normal;
          if (cell.textHalign) td.style.textAlign = cell.textHalign;
          if (cell.textValign) td.style.verticalAlign = cell.textValign;
          if (cell.tooltip) td.title = cell.tooltip;
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }
}
