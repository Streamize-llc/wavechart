/** Clamp value to [min, max] range */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation between a and b by factor t */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Round to nearest 0.5 for crisp 1px lines on canvas */
export function roundToPixel(value: number): number {
  return Math.round(value) + 0.5;
}

/** Round to nearest integer pixel (for rects/fills) */
export function roundToInt(value: number): number {
  return Math.round(value);
}

/** Generate "nice" numbers for axis ticks */
export function niceNum(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

/** Generate nice tick values for an axis range */
export function generateTicks(min: number, max: number, maxTicks: number): number[] {
  if (min >= max || maxTicks < 2) return [];

  const range = niceNum(max - min, false);
  const tickSpacing = niceNum(range / (maxTicks - 1), true);
  const niceMin = Math.floor(min / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + tickSpacing * 0.5; v += tickSpacing) {
    if (v >= min && v <= max) {
      ticks.push(v);
    }
  }
  return ticks;
}
