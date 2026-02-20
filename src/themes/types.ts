/** Complete theme definition */
export interface Theme {
  name: string;
  background: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;

  grid: {
    color: string;
    style: 'solid' | 'dashed';
  };

  crosshair: {
    color: string;
    labelBackground: string;
    labelTextColor: string;
  };

  candle: {
    upColor: string;
    downColor: string;
    upBorderColor: string;
    downBorderColor: string;
    wickUpColor: string;
    wickDownColor: string;
  };

  line: {
    color: string;
    width: number;
  };

  area: {
    lineColor: string;
    topColor: string;
    bottomColor: string;
  };

  volume: {
    upColor: string;
    downColor: string;
  };

  priceScale: {
    borderColor: string;
    textColor: string;
  };

  timeScale: {
    borderColor: string;
    textColor: string;
  };

  separator: {
    color: string;
    hoverColor: string;
  };

  tooltip: {
    background: string;
    textColor: string;
    borderColor: string;
  };

  watermark: {
    color: string;
  };
}
