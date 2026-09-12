"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from "lightweight-charts";

type Candle = { time: number; open: number; high: number; low: number; close: number };

type Props = { symbol?: string; timeframe?: string; height?: number };

function formatPrice(value: number) { return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function LiveFinancialChart({ symbol = "XAU/USD", timeframe = "15m", height = 560 }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<number | null>(null);
  const [status, setStatus] = useState("Loading live market data…");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const chart = createChart(root, {
      width: root.clientWidth,
      height,
      layout: { background: { type: ColorType.Solid, color: "#080a0f" }, textColor: "#8f98a8" },
      grid: { vertLines: { color: "rgba(255,255,255,.035)" }, horzLines: { color: "rgba(255,255,255,.035)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,.08)" },
      timeScale: { borderColor: "rgba(255,255,255,.08)", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "rgba(99,133,255,.7)" }, horzLine: { color: "rgba(99,133,255,.7)" } },
    });
    const series = chart.addSeries(CandlestickSeries, { upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350", lastValueVisible: true, priceLineVisible: true });
    chartRef.current = chart; seriesRef.current = series;
    const resize = () => chart.applyOptions({ width: root.clientWidth, height });
    const observer = new ResizeObserver(resize); observer.observe(root);
    return () => { observer.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [height]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [chartResponse, marketResponse] = await Promise.all([fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1500`, { cache: "no-store" }), fetch("/api/market", { cache: "no-store" })]);
        const chartPayload = await chartResponse.json();
        const marketPayload = await marketResponse.json();
        if (cancelled) return;
        if (!chartResponse.ok || !chartPayload.ok) throw new Error(chartPayload.message || "Chart data unavailable");
        const next = (chartPayload.candles ?? []) as Candle[];
        setCandles(next);
        const live = Number(marketPayload.price);
        setQuote(Number.isFinite(live) ? live : null);
        const series = seriesRef.current;
        if (series && next.length) series.setData(next.map((c) => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })) as CandlestickData[]);
        chartRef.current?.timeScale().fitContent();
        setStatus(marketPayload.marketOpen ? "LIVE · Twelve Data" : "MARKET CLOSED · latest provider quote");
      } catch (error) { if (!cancelled) setStatus(error instanceof Error ? error.message : "Market data unavailable"); }
    };
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [symbol, timeframe]);

  return <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#080a0f]">
    <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
      <div><div className="text-xs font-semibold text-white">{symbol}</div><div className="text-[10px] uppercase tracking-[.18em] text-slate-500">{timeframe} · {candles.length} candles</div></div>
      <div className="text-right"><div className="text-lg font-semibold tracking-tight text-white">{quote == null ? "—" : `$${formatPrice(quote)}`}</div><div className="text-[10px] uppercase tracking-[.14em] text-slate-500">{status}</div></div>
    </div>
    <div ref={rootRef} />
  </div>;
}
