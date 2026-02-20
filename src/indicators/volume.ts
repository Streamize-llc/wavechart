import type { DataStore } from '../model/store';
import type { IndicatorOutput } from './types';
import { registerIndicator } from './registry';

function calcVolume(store: DataStore, _params: Record<string, number>): IndicatorOutput[] {
  const n = store.length;
  const result = new Array<number>(n);
  const volumeArr = store.volume;

  for (let i = 0; i < n; i++) {
    result[i] = volumeArr[i];
  }

  return [{
    name: 'Volume',
    data: result,
    style: {
      type: 'histogram',
      positiveColor: 'rgba(38, 166, 154, 0.5)',
      negativeColor: 'rgba(239, 83, 80, 0.5)',
    },
  }];
}

registerIndicator({
  name: 'volume',
  defaultPane: 'separate',
  defaultParams: {},
  calc: calcVolume,
});
