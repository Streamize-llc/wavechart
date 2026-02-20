import { useEffect, useRef } from 'react';
import { Chart, type BarData } from 'wavechart';

function generateData(count: number): BarData[] {
  const bars: BarData[] = [];
  let price = 100;
  const baseTime = Math.floor(Date.now() / 1000) - count * 3600;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 3;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.random() * 1000000 + 500000;

    bars.push({
      time: baseTime + i * 3600,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
    });

    price = close;
  }
  return bars;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = new Chart(containerRef.current, { theme: 'dark' });
    chart.setData(generateData(500));
    chart.addSeries('volume');
    chart.addIndicator('sma', { length: 20 });

    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
