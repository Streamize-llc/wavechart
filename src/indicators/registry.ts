import type { IndicatorDef } from './types';

/** Global indicator registry */
const registry = new Map<string, IndicatorDef>();

/** Register an indicator */
export function registerIndicator(def: IndicatorDef): void {
  registry.set(def.name, def);
}

/** Get an indicator by name */
export function getIndicator(name: string): IndicatorDef | undefined {
  return registry.get(name);
}

/** List all registered indicator names */
export function listIndicators(): string[] {
  return Array.from(registry.keys());
}
