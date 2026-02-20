import type { BarData } from '../core/types';
import type { DataAdapter } from './adapter';

export interface WebSocketAdapterOptions {
  /** WebSocket URL */
  url: string;
  /** Transform incoming message to BarData or Partial<BarData> */
  transform?: (data: unknown) => { type: 'bar'; bar: BarData } | { type: 'update'; bar: Partial<BarData> } | null;
  /** Message to send on connection (e.g. subscription) */
  subscribeMessage?: unknown;
  /** Auto-reconnect delay in ms (0 = no reconnect) */
  reconnectDelay?: number;
}

/** WebSocket real-time streaming data adapter */
export class WebSocketDataAdapter implements DataAdapter {
  private _opts: Required<WebSocketAdapterOptions>;
  private _ws: WebSocket | null = null;
  private _barCb: ((bar: BarData) => void) | null = null;
  private _updateCb: ((bar: Partial<BarData>) => void) | null = null;
  private _historicalCb: ((bars: BarData[]) => void) | null = null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _intentionalClose = false;

  constructor(opts: WebSocketAdapterOptions) {
    this._opts = {
      url: opts.url,
      transform: opts.transform ?? defaultTransform,
      subscribeMessage: opts.subscribeMessage ?? null,
      reconnectDelay: opts.reconnectDelay ?? 3000,
    };
  }

  connect(): void {
    this._intentionalClose = false;
    this._ws = new WebSocket(this._opts.url);

    this._ws.onopen = () => {
      if (this._opts.subscribeMessage) {
        this._ws?.send(JSON.stringify(this._opts.subscribeMessage));
      }
    };

    this._ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const result = this._opts.transform(data);
        if (!result) return;

        if (result.type === 'bar') {
          this._barCb?.(result.bar);
        } else if (result.type === 'update') {
          this._updateCb?.(result.bar);
        }
      } catch (e) {
        console.error('WebSocketDataAdapter message error:', e);
      }
    };

    this._ws.onclose = () => {
      if (!this._intentionalClose && this._opts.reconnectDelay > 0) {
        this._reconnectTimer = setTimeout(() => this.connect(), this._opts.reconnectDelay);
      }
    };

    this._ws.onerror = (e) => {
      console.error('WebSocket error:', e);
    };
  }

  disconnect(): void {
    this._intentionalClose = true;
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    this._ws?.close();
    this._ws = null;
  }

  onBar(callback: (bar: BarData) => void): void {
    this._barCb = callback;
  }

  onUpdate(callback: (bar: Partial<BarData>) => void): void {
    this._updateCb = callback;
  }

  onHistorical(callback: (bars: BarData[]) => void): void {
    this._historicalCb = callback;
  }
}

function defaultTransform(data: unknown): { type: 'bar'; bar: BarData } | { type: 'update'; bar: Partial<BarData> } | null {
  if (typeof data === 'object' && data !== null && 'time' in data) {
    const d = data as Record<string, number>;
    if ('open' in d && 'high' in d && 'low' in d && 'close' in d) {
      return {
        type: 'bar',
        bar: {
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume ?? 0,
        },
      };
    }
  }
  return null;
}
