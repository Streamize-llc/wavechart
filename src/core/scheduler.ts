/** Bitfield flags for selective invalidation */
export const enum DirtyFlag {
  None       = 0,
  MainPane   = 1 << 0,
  Overlay    = 1 << 1,
  XAxis      = 1 << 2,
  YAxis      = 1 << 3,
  Indicators = 1 << 4,
  Layout     = 1 << 5,
  All        = 0x3F,
}

/**
 * rAF scheduler that coalesces invalidation requests.
 * At most one render per animation frame.
 */
export class Scheduler {
  private dirty: number = DirtyFlag.None;
  private rafId: number | null = null;
  private renderCallback: ((flags: number) => void) | null = null;

  /** Set the render callback */
  setRenderCallback(cb: (flags: number) => void): void {
    this.renderCallback = cb;
  }

  /** Mark flags as dirty and schedule a render */
  invalidate(flags: number): void {
    this.dirty |= flags;
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => this.flush());
    }
  }

  /** Check if specific flag is dirty */
  isDirty(flag: DirtyFlag): boolean {
    return (this.dirty & flag) !== 0;
  }

  /** Force synchronous render (for resize) */
  forceRender(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.dirty = DirtyFlag.All;
    this.flush();
  }

  private flush(): void {
    this.rafId = null;
    const flags = this.dirty;
    this.dirty = DirtyFlag.None;
    if (flags !== DirtyFlag.None) {
      this.renderCallback?.(flags);
    }
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.renderCallback = null;
  }
}
