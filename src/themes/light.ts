import type { Theme } from './types';

export const lightTheme: Theme = {
  name: 'light',
  background: '#FFFFFF',
  textColor: '#131722',
  fontSize: 11,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  grid: {
    color: 'rgba(0, 0, 0, 0.06)',
    style: 'solid',
  },

  crosshair: {
    color: 'rgba(0, 0, 0, 0.3)',
    labelBackground: '#4C525E',
    labelTextColor: '#FFFFFF',
  },

  candle: {
    upColor: '#26A69A',
    downColor: '#EF5350',
    upBorderColor: '#26A69A',
    downBorderColor: '#EF5350',
    wickUpColor: '#26A69A',
    wickDownColor: '#EF5350',
  },

  line: {
    color: '#2196F3',
    width: 2,
  },

  area: {
    lineColor: '#2196F3',
    topColor: 'rgba(33, 150, 243, 0.28)',
    bottomColor: 'rgba(33, 150, 243, 0.0)',
  },

  volume: {
    upColor: 'rgba(38, 166, 154, 0.5)',
    downColor: 'rgba(239, 83, 80, 0.5)',
  },

  priceScale: {
    borderColor: '#E0E3EB',
    textColor: '#131722',
  },

  timeScale: {
    borderColor: '#E0E3EB',
    textColor: '#131722',
  },

  separator: {
    color: '#E0E3EB',
    hoverColor: '#B2B5BE',
  },

  tooltip: {
    background: '#FFFFFF',
    textColor: '#131722',
    borderColor: '#E0E3EB',
  },

  watermark: {
    color: 'rgba(0, 0, 0, 0.06)',
  },
};
