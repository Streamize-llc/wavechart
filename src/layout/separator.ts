import type { Theme } from '../themes/types';

/**
 * Drag handle between panes for resizing.
 * Implemented in Phase 4 (multi-pane).
 */
export class Separator {
  readonly element: HTMLDivElement;
  private _height = 4;
  private _dragging = false;
  private _onDrag: ((deltaY: number) => void) | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.style.height = `${this._height}px`;
    this.element.style.cursor = 'row-resize';
    this.element.style.position = 'relative';
    this.element.style.zIndex = '10';
  }

  setTheme(theme: Theme): void {
    this.element.style.backgroundColor = theme.separator.color;
    this.element.addEventListener('mouseenter', () => {
      if (!this._dragging) {
        this.element.style.backgroundColor = theme.separator.hoverColor;
      }
    });
    this.element.addEventListener('mouseleave', () => {
      if (!this._dragging) {
        this.element.style.backgroundColor = theme.separator.color;
      }
    });
  }

  onDrag(callback: (deltaY: number) => void): void {
    this._onDrag = callback;

    let startY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      startY = e.clientY;
      this._onDrag?.(delta);
    };

    const onMouseUp = () => {
      this._dragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    this.element.addEventListener('mousedown', (e) => {
      this._dragging = true;
      startY = e.clientY;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  get height(): number {
    return this._height;
  }

  destroy(): void {
    this.element.remove();
  }
}
