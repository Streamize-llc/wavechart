/**
 * Pine Script shape drawing primitives.
 *
 * Used by plotshape, plotchar, and label drawings. Each shape function draws
 * at (cx, cy) with a given size in pixels, using the provided ctx. `fillOnly`
 * skips strokes for compact marker rendering.
 */

export type PineShape =
  | 'xcross'
  | 'cross'
  | 'triangleup'
  | 'triangledown'
  | 'flag'
  | 'circle'
  | 'arrowup'
  | 'arrowdown'
  | 'square'
  | 'diamond'
  | 'label_up'
  | 'label_down'
  | 'label_left'
  | 'label_right'
  | 'label_center'
  | 'text_outline'
  | 'labelup'
  | 'labeldown'
  | 'none';

export type PineSize = 'auto' | 'tiny' | 'small' | 'normal' | 'large' | 'huge';

/** Convert Pine size enum to pixel diameter. */
export function sizeToPx(size: PineSize | string | undefined, fallback = 10): number {
  switch (size) {
    case 'tiny': return 6;
    case 'small': return 8;
    case 'normal': return 10;
    case 'large': return 14;
    case 'huge': return 20;
    case 'auto':
    default: return fallback;
  }
}

/** Convert Pine line.style / hline.style / label style to canvas dash pattern. */
export function dashPattern(style: string | undefined, lineWidth: number): number[] {
  switch (style) {
    case 'dashed':
      return [Math.max(6, lineWidth * 4), Math.max(4, lineWidth * 2)];
    case 'dotted':
      return [Math.max(2, lineWidth), Math.max(2, lineWidth * 2)];
    case 'arrow_left':
    case 'arrow_right':
    case 'arrow_both':
    case 'solid':
    default:
      return [];
  }
}

/**
 * Draw a shape centered at (cx, cy). Returns true if anything was drawn.
 * For 'none' / unknown shapes returns false (caller may fall back to a dot).
 */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  cx: number,
  cy: number,
  size: number,
  color: string,
  fillOnly = false
): boolean {
  const half = size / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.15);
  ctx.beginPath();

  switch (shape) {
    case 'xcross':
      ctx.moveTo(cx - half, cy - half);
      ctx.lineTo(cx + half, cy + half);
      ctx.moveTo(cx + half, cy - half);
      ctx.lineTo(cx - half, cy + half);
      ctx.stroke();
      ctx.restore();
      return true;

    case 'cross':
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx, cy + half);
      ctx.moveTo(cx - half, cy);
      ctx.lineTo(cx + half, cy);
      ctx.stroke();
      ctx.restore();
      return true;

    case 'triangleup':
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx + half, cy + half);
      ctx.lineTo(cx - half, cy + half);
      ctx.closePath();
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;

    case 'triangledown':
      ctx.moveTo(cx, cy + half);
      ctx.lineTo(cx + half, cy - half);
      ctx.lineTo(cx - half, cy - half);
      ctx.closePath();
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;

    case 'flag': {
      const poleH = size * 1.2;
      ctx.moveTo(cx - half * 0.6, cy + poleH / 2);
      ctx.lineTo(cx - half * 0.6, cy - poleH / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - half * 0.6, cy - poleH / 2);
      ctx.lineTo(cx + half, cy - poleH / 4);
      ctx.lineTo(cx - half * 0.6, cy);
      ctx.closePath();
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;
    }

    case 'circle':
      ctx.arc(cx, cy, half, 0, Math.PI * 2);
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;

    case 'arrowup': {
      const w = half * 0.8;
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx + w * 0.5, cy);
      ctx.lineTo(cx + w * 0.5, cy + half);
      ctx.lineTo(cx - w * 0.5, cy + half);
      ctx.lineTo(cx - w * 0.5, cy);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;
    }

    case 'arrowdown': {
      const w = half * 0.8;
      ctx.moveTo(cx, cy + half);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx + w * 0.5, cy);
      ctx.lineTo(cx + w * 0.5, cy - half);
      ctx.lineTo(cx - w * 0.5, cy - half);
      ctx.lineTo(cx - w * 0.5, cy);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;
    }

    case 'square':
      ctx.rect(cx - half, cy - half, size, size);
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;

    case 'diamond':
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx + half, cy);
      ctx.lineTo(cx, cy + half);
      ctx.lineTo(cx - half, cy);
      ctx.closePath();
      ctx.fill();
      if (!fillOnly) ctx.stroke();
      ctx.restore();
      return true;

    case 'none':
      ctx.restore();
      return false;

    default:
      ctx.restore();
      return false;
  }
}

/** Draw an arrow head at (x, y) pointing in the direction of `angle` (radians). */
export function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - size * Math.cos(angle - Math.PI / 6),
    y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x - size * Math.cos(angle + Math.PI / 6),
    y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
