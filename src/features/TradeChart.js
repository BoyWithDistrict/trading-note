'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'

async function fetchRealHistoricalData(ticker, timeframe, fromTime, toTime) {
  try {
    const API_KEY = 'e61c64eef90646cfaf04f0ca24f5d056';
    const cleanedTicker = ticker.replace(/[^a-zA-Z]/g, '');
    const isForexPair = cleanedTicker.length === 6 || cleanedTicker.includes('XAU');
    const formattedTicker = isForexPair
      ? `${cleanedTicker.substring(0, 3)}/${cleanedTicker.substring(3)}`
      : cleanedTicker;

    const intervalMap = {
      '1min': '1min',
      '5min': '5min',
      '15min': '15min',
      '30min': '30min',
      '60min': '1h',
      'daily': '1day'
    };
    const interval = intervalMap[timeframe];
    if (!interval) throw new Error(`Unsupported timeframe: ${timeframe}`);

    const formatDate = (ts) => new Date(ts * 1000).toISOString().split('T')[0];
    const url = `https://api.twelvedata.com/time_series?symbol=${formattedTicker}&interval=${interval}&start_date=${formatDate(fromTime)}&end_date=${formatDate(toTime)}&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message || 'Twelve Data API error');
    if (!data.values?.length) throw new Error('No historical data available');

    return data.values.map((item) => {
      const [date, time] = item.datetime.split(' ');
      const [y, m, d] = date.split('-').map(Number);
      const [hh, mm, ss] = time.split(':').map(Number);
      return {
        time: Math.floor(Date.UTC(y, m - 1, d, hh, mm, ss) / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close)
      }
    }).sort((a, b) => a.time - b.time);
  } catch (err) {
    console.error('API error:', err);
    throw new Error(err.message);
  }
}

export default function TradeChart({ trade, onClose }) {
  const chartContainer = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const priceLinesRef = useRef([]);

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('60min');

  useEffect(() => {
    if (!trade) return;
    let mounted = true;

    const load = async () => {
      try {
        setStatus('loading');
        const entry = Math.floor(new Date(trade.entryTime).getTime() / 1000);
        const exit = trade.exitTime ? Math.floor(new Date(trade.exitTime).getTime() / 1000) : Math.floor(Date.now() / 1000);
        const bars = await fetchRealHistoricalData(trade.ticker, timeframe, entry - 3 * 86400, exit + 86400);
        if (mounted) {
          setData(bars);
          setStatus('ready');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    }

    const timeout = setTimeout(load, 500);
    return () => { mounted = false; clearTimeout(timeout); };
  }, [trade, timeframe]);

  useEffect(() => {
    if (!data || !chartContainer.current) return;

    const chart = createChart(chartContainer.current, {
      layout: { background: { color: '#fff' }, textColor: '#222' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      timeScale: { timeVisible: true, secondsVisible: false },
      width: chartContainer.current.clientWidth,
      height: chartContainer.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      borderUpColor: '#26a69a', borderDownColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });

    series.setData(data);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = series;

    resizeObserverRef.current = new ResizeObserver(([entry]) => {
      chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    resizeObserverRef.current.observe(chartContainer.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      chart.remove();
    };
  }, [data]);

  useEffect(() => {
    if (!candleSeriesRef.current || !trade || status !== 'ready') return;

    priceLinesRef.current.forEach(l => candleSeriesRef.current.removePriceLine(l));
    priceLinesRef.current = [];

    const markers = [];
    const entryT = Math.floor(new Date(trade.entryTime).getTime() / 1000);
    markers.push({
      time: entryT,
      position: trade.direction === 'Long' ? 'belowBar' : 'aboveBar',
      color: trade.direction === 'Long' ? '#26a69a' : '#ef5350',
      shape: trade.direction === 'Long' ? 'arrowUp' : 'arrowDown',
      text: 'Entry'
    });

    if (trade.exitTime) {
      const exitT = Math.floor(new Date(trade.exitTime).getTime() / 1000);
      markers.push({
        time: exitT,
        position: trade.direction === 'Long' ? 'aboveBar' : 'belowBar',
        color: trade.profit >= 0 ? '#26a69a' : '#ef5350',
        shape: trade.direction === 'Long' ? 'arrowDown' : 'arrowUp',
        text: 'Exit'
      });
    }

    candleSeriesRef.current.setMarkers?.(markers);

    const entryLine = candleSeriesRef.current.createPriceLine({
      price: trade.entryPrice,
      color: '#2962FF',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Entry'
    });
    priceLinesRef.current.push(entryLine);

    if (trade.stopLoss) {
      const sl = candleSeriesRef.current.createPriceLine({
        price: trade.stopLoss,
        color: '#f44336',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL'
      });
      priceLinesRef.current.push(sl);
    }

    if (trade.takeProfit) {
      const tp = candleSeriesRef.current.createPriceLine({
        price: trade.takeProfit,
        color: '#4caf50',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP'
      });
      priceLinesRef.current.push(tp);
    }
  }, [trade, status]);

  const retry = () => {
    setStatus('loading');
    setData(null);
  };

  return trade ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-4xl h-[70vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3>{trade.ticker} • {trade.direction}</h3>
          <div className="flex gap-2 items-center">
            <select className="border px-2 py-1" value={timeframe} onChange={e => setTimeframe(e.target.value)}>
              {['1min','5min','15min','30min','60min','daily'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <button onClick={onClose} className="text-xl text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>
        <div className="relative flex-grow">
          <div ref={chartContainer} className="absolute inset-0" />
          {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center bg-white">Loading...</div>}
          {status === 'error' && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
            <p className="text-red-500 mb-2">{error}</p>
            <button onClick={retry} className="px-4 py-2 bg-blue-500 text-white rounded">Try Again</button>
          </div>}
        </div>
      </div>
    </div>
  ) : null;
}
