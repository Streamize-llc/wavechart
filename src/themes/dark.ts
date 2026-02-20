import type { Theme } from './types';

export const darkTheme: Theme = {
  name: 'dark',
  background: '#131722',
  textColor: '#B2B5BE',
  fontSize: 11,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  grid: {
    color: 'rgba(54, 60, 78, 0.5)',
    style: 'solid',
  },

  crosshair: {
    color: 'rgba(150, 150, 150, 0.5)',
    labelBackground: '#363C4E',
    labelTextColor: '#B2B5BE',
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
    topColor: 'rgba(33, 150, 243, 0.4)',
    bottomColor: 'rgba(33, 150, 243, 0.0)',
  },

  volume: {
    upColor: 'rgba(38, 166, 154, 0.5)',
    downColor: 'rgba(239, 83, 80, 0.5)',
  },

  priceScale: {
    borderColor: '#2A2E39',
    textColor: '#B2B5BE',
  },

  timeScale: {
    borderColor: '#2A2E39',
    textColor: '#B2B5BE',
  },

  separator: {
    color: '#2A2E39',
    hoverColor: '#4A4E59',
  },

  tooltip: {
    background: '#1E222D',
    textColor: '#B2B5BE',
    borderColor: '#2A2E39',
  },

  watermark: {
    color: 'rgba(88, 92, 107, 0.2)',
  },
};
