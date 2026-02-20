/** Get current device pixel ratio */
export function getDevicePixelRatio(): number {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

/**
 * Watch for DPR changes (e.g. moving window between monitors).
 * Returns a cleanup function to stop watching.
 */
export function watchDpr(callback: (dpr: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let currentDpr = getDevicePixelRatio();
  let mql: MediaQueryList | null = null;

  const check = () => {
    const newDpr = getDevicePixelRatio();
    if (newDpr !== currentDpr) {
      currentDpr = newDpr;
      callback(newDpr);
    }
    // Re-register since matchMedia for resolution is one-shot per value
    listen();
  };

  const listen = () => {
    mql?.removeEventListener('change', check);
    mql = window.matchMedia(`(resolution: ${currentDpr}dppx)`);
    mql.addEventListener('change', check);
  };

  listen();

  return () => {
    mql?.removeEventListener('change', check);
  };
}
