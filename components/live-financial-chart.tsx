"use client";

import { useEffect, useMemo, useState } from "react";

type Candle = { time: number; open: number; high: number; low: number; close: number };
type Props = { symbol?: string; timeframe?: string; height?: number };

function formatPrice(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cleanCandles(value: unknown): Candle[] {
  if (!Array.isArray(value)) return [];
  const rows = value
    .map((raw) => {
      const c = raw as Partial<Candle>;
      return {
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      };
    })
    .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close))
    .sort((a, b) => a.time - b.time);

  const unique: Candle[] = [];
  for (const candle of rows) {
    if (!unique.length || candle.time > unique[unique.length - 1].time) unique.push(candle);
  }
  return unique;
}

export default function LiveFinancialChart({ symbol = "XAU/USD", timeframe = "15m", height = 560 }: Props) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<number | null>(null);
  const [status, setStatus] = useState("Loading market data…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [chartResponse, marketResponse] = await Promise.all([
          fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=250`, { cache: "no-store" }),
          fetch("/api/market", { cache: "no-store" }),
        ]);
        const chartPayload: unknown = await chartResponse.json();
        const marketPayload: unknown = await marketResponse.json();
        if (cancelled) return;

        const chart = chartPayload as { ok?: boolean; candles?: unknown; message?: string };
        const market = marketPayload as { price?: unknown; marketOpen?: boolean; message?: string };
        if (!chartResponse.ok || chart.ok !== true) throw new Error(chart.message || "Chart data unavailable");

        const next = cleanCandles(chart.candles);
        const live = Number(market.price);
        if (Number.isFinite(live) && next.length) {
          const last = { ...next[next.length - 1] };
          last.close = live;
          last.high = Math.max(last.high, live);
          last.low = Math.min(last.low, live);
          next[next.length - 1] = last;
        }

        setCandles(next);
        setQuote(Number.isFinite(live) ? live : null);
        setError(null);
        setStatus(market.marketOpen ? "LIVE · Twelve Data" : "MARKET CLOSED · latest provider quote");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Market data unavailable");
          setStatus("DATA UNAVAILABLE");
        }
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [symbol, timeframe]);

  const visible = useMemo(() => candles.slice(-90), [candles]);
  const geometry = useMemo(() => {
    if (!visible.length) return null;
    const width = 1200;
    const top = 28;
    const bottom = 38;
    const left = 16;
    const right = 76;
    const plotW = width - left - right;
    const plotH = Math.max(180, height - top - bottom);
    const values = visible.flatMap((c) => [c.high, c.low]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.08, 1);
    const lo = min - padding;
    const hi = max + padding;
    const y = (value: number) => top + ((hi - value) / (hi - lo)) * plotH;
    const step = plotW / Math.max(visible.length, 1);
    return { width, top, bottom, left, right, plotW, plotH, y, step, lo, hi };
  }, [height, visible]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#080a0f] text-white">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-xs font-semibold">{symbol}</div>
          <div className="text-[10px] uppercase tracking-[.18em] text-slate-500">{timeframe} · {candles.length} candles</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold tracking-tight">{quote == null ? "—" : `$${formatPrice(quote)}`}</div>
          <div className="text-[10px] uppercase tracking-[.14em] text-slate-500">{status}</div>
        </div>
      </div>

      {error && !candles.length ? (
        <div style={{ height }} className="grid place-items-center px-6 text-center">
          <div>
            <div className="text-sm font-medium text-white">Chart temporarily unavailable</div>
            <div className="mt-1 text-xs text-slate-500">{error}. The workspace remains usable and will retry automatically.</div>
          </div>
        </div>
      ) : geometry ? (
        <div style={{ height }} className="w-full">
          <svg viewBox={`0 0 ${geometry.width} ${height}`} className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={`${symbol} ${timeframe} candlestick chart`}>
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = geometry.top + geometry.plotH * fraction;
              const value = geometry.hi - (geometry.hi - geometry.lo) * fraction;
              return <g key={fraction}><line x1={geometry.left} x2={geometry.width - geometry.right} y1={y} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth="1"/><text x={geometry.width - 8} y={y + 4} textAnchor="end" fill="#687285" fontSize="12">{formatPrice(value)}</text></g>;
            })}
            {visible.map((candle, index) => {
              const x = geometry.left + geometry.step * index + geometry.step / 2;
              const openY = geometry.y(candle.open);
              const closeY = geometry.y(candle.close);
              const highY = geometry.y(candle.high);
              const lowY = geometry.y(candle.low);
              const rising = candle.close >= candle.open;
              const bodyY = Math.min(openY, closeY);
              const bodyH = Math.max(Math.abs(closeY - openY), 2);
              const bodyW = Math.max(Math.min(geometry.step * 0.62, 12), 3);
              const fill = rising ? "#26a69a" : "#ef5350";
              return <g key={`${candle.time}-${index}`}><line x1={x} x2={x} y1={highY} y2={lowY} stroke={fill} strokeWidth="1.5"/><rect x={x - bodyW / 2} y={bodyY} width={bodyW} height={bodyH} rx="1" fill={fill}/></g>;
            })}
            {quote != null && <><line x1={geometry.left} x2={geometry.width - geometry.right} y1={geometry.y(quote)} y2={geometry.y(quote)} stroke="#8ea2ff" strokeDasharray="7 6" strokeWidth="1.5"/><rect x={geometry.width - geometry.right + 5} y={geometry.y(quote) - 11} width="66" height="22" rx="6" fill="#8ea2ff"/><text x={geometry.width - 4} y={geometry.y(quote) + 4} textAnchor="end" fill="#080a0f" fontSize="11" fontWeight="700">{formatPrice(quote)}</text></>}
          </svg>
        </div>
      ) : (
        <div style={{ height }} className="grid place-items-center text-xs text-slate-500">Waiting for provider candles…</div>
      )}
    </div>
  );
}
