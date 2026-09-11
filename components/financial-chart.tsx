"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CandlestickData, CrosshairMode, IChartApi, ISeriesApi, LineStyle, PriceScaleMode,
  UTCTimestamp, createChart,
} from "lightweight-charts";
import {
  ChartCandle, ChartType, Drawing, DrawingTool, Timeframe, useFinancialChartStore,
} from "@/lib/financial-chart-store";
import { atr, bollinger, ema, macd, rsi, sma, stochastic, vwap, wma } from "@/lib/financial-indicators";

export interface ChartRealtimeMessage {
  time: number; open: number; high: number; low: number; close: number; volume?: number; closed?: boolean;
}

export interface FinancialChartProps {
  symbol?: string;
  initialTimeframe?: Timeframe;
  initialData?: ChartCandle[];
  historyUrl?: string;
  websocket?: WebSocket | null;
  websocketUrl?: string;
  height?: number | string;
  className?: string;
  onSymbolChange?: (symbol: string) => void;
}

const TIMEFRAMES: Timeframe[] = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "12h", "1D", "1W", "1M"];
const CHART_TYPES: Array<[ChartType, string]> = [["candles", "Candles"], ["hollow", "Hollow"], ["heikin", "Heikin Ashi"], ["line", "Line"], ["area", "Area"], ["bar", "Bars"], ["baseline", "Baseline"]];
const DRAWING_TOOLS: Array<[DrawingTool, string]> = [["cursor", "Cursor"], ["trend", "Trend line"], ["horizontal", "Horizontal line"], ["vertical", "Vertical line"], ["ray", "Ray"], ["fib", "Fibonacci"], ["rectangle", "Rectangle"], ["text", "Text"]];

const DARK = { background: "#0b0e13", panel: "#11151b", grid: "rgba(255,255,255,.045)", text: "#a9b2c0", border: "#252b34", up: "#26a69a", down: "#ef5350", blue: "#4f7cff", orange: "#f0a15a" };
const LIGHT = { background: "#fbfcfe", panel: "#ffffff", grid: "rgba(18,27,44,.07)", text: "#667085", border: "#dfe4ea", up: "#149b79", down: "#e25555", blue: "#3157d5", orange: "#d97757" };

function finite(value: number): value is number { return Number.isFinite(value); }
function cleanCandles(input: ChartCandle[], limit = 10000): ChartCandle[] {
  const map = new Map<number, ChartCandle>();
  for (const candle of input) {
    if (![candle.time, candle.open, candle.high, candle.low, candle.close].every(finite)) continue;
    if (candle.high < candle.low) continue;
    map.set(candle.time, candle);
  }
  return [...map.values()].sort((a, b) => a.time - b.time).slice(-limit);
}

function toHeikin(candles: ChartCandle[]): ChartCandle[] {
  return candles.map((candle, index) => {
    const close = (candle.open + candle.high + candle.low + candle.close) / 4;
    const open = index === 0 ? (candle.open + candle.close) / 2 : (candles[index - 1].open + candles[index - 1].close) / 2;
    return { ...candle, open, close, high: Math.max(candle.high, open, close), low: Math.min(candle.low, open, close) };
  });
}

function mockCandles(count = 1200): ChartCandle[] {
  const out: ChartCandle[] = [];
  let price = 4300;
  const now = Math.floor(Date.now() / 60000) * 60;
  for (let i = count; i >= 0; i -= 1) {
    const time = now - i * 900;
    const drift = Math.sin(i / 37) * 2.4 + Math.cos(i / 91) * 1.2;
    const open = price;
    const close = Math.max(100, open + drift + (Math.random() - 0.5) * 8);
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    price = close;
    out.push({ time, open, high, low, close, volume: 500 + Math.random() * 1800 });
  }
  return out;
}

function formatPrice(value: number | undefined): string {
  if (!finite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function iconFor(tool: DrawingTool): string {
  return ({ cursor: "↖", trend: "╱", horizontal: "─", vertical: "│", ray: "→", fib: "F", rectangle: "□", text: "T" } as Record<DrawingTool, string>)[tool];
}

export default function FinancialChart({
  symbol: symbolProp = "XAU/USD", initialTimeframe = "15m", initialData, historyUrl = "/api/chart", websocket, websocketUrl,
  height = 680, className = "", onSymbolChange,
}: FinancialChartProps) {
  const store = useFinancialChartStore();
  const setStore = store.set;
  const theme = store.theme === "dark" ? DARK : LIGHT;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Bar"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | ISeriesApi<"Baseline"> | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [candles, setCandles] = useState<ChartCandle[]>(() => cleanCandles(initialData ?? mockCandles()));
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [search, setSearch] = useState(symbolProp);
  const [indicatorMenu, setIndicatorMenu] = useState(false);
  const [drawingMenu, setDrawingMenu] = useState(false);
  const [crosshair, setCrosshair] = useState<{ time?: number; price?: number; index?: number } | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [draggingDrawing, setDraggingDrawing] = useState<{ id: string; startX: number; startY: number } | null>(null);
  const symbol = store.symbol || symbolProp;

  useEffect(() => { setStore({ symbol: symbolProp, timeframe: initialTimeframe }); }, [initialTimeframe, setStore, symbolProp]);

  const persistKey = useMemo(() => `xauusd-poi-drawings:${symbol}`, [symbol]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(persistKey);
      if (saved) setStore({ drawings: JSON.parse(saved) as Drawing[] });
    } catch { /* ignore malformed local state */ }
  }, [persistKey, setStore]);
  useEffect(() => {
    try { localStorage.setItem(persistKey, JSON.stringify(store.drawings)); } catch { /* storage may be unavailable */ }
  }, [persistKey, store.drawings]);

  const loadHistory = useCallback(async (timeframe: Timeframe, requestedSymbol = symbol) => {
    setLoading(true); setError(null);
    try {
      const url = new URL(historyUrl, window.location.origin);
      url.searchParams.set("symbol", requestedSymbol);
      url.searchParams.set("timeframe", timeframe);
      url.searchParams.set("limit", "2500");
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "Market data unavailable");
      setCandles(cleanCandles(payload.candles));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load chart data");
    } finally { setLoading(false); }
  }, [historyUrl, symbol]);

  useEffect(() => { if (!initialData) void loadHistory(store.timeframe, symbol); }, [initialData, loadHistory, store.timeframe, symbol]);

  useEffect(() => {
    if (!websocket && !websocketUrl) return;
    const socket = websocket ?? new WebSocket(websocketUrl!);
    const onMessage = (event: MessageEvent<string>) => {
      try {
        const raw = JSON.parse(event.data) as Partial<ChartRealtimeMessage>;
        if (![raw.time, raw.open, raw.high, raw.low, raw.close].every((v) => typeof v === "number" && Number.isFinite(v))) return;
        const next: ChartCandle = { time: raw.time!, open: raw.open!, high: raw.high!, low: raw.low!, close: raw.close!, volume: raw.volume };
        setCandles((current) => {
          const index = current.findIndex((item) => item.time === next.time);
          if (index >= 0) { const copy = current.slice(); copy[index] = next; return copy; }
          const insertAt = current.findIndex((item) => item.time > next.time);
          const copy = current.slice();
          if (insertAt < 0) copy.push(next); else copy.splice(insertAt, 0, next);
          return copy.slice(-10000);
        });
      } catch { /* ignore malformed provider frames */ }
    };
    socket.addEventListener("message", onMessage);
    return () => { socket.removeEventListener("message", onMessage); if (!websocket) socket.close(); };
  }, [websocket, websocketUrl]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const chart = createChart(element, {
      width: element.clientWidth,
      height: typeof height === "number" ? height : 680,
      layout: { background: { color: theme.background }, textColor: theme.text, fontFamily: "Inter, ui-sans-serif, system-ui" },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
      crosshair: {
        mode: store.magnet ? CrosshairMode.Magnet : CrosshairMode.Normal,
        vertLine: { color: theme.blue, width: 1, style: LineStyle.Dashed, labelBackgroundColor: theme.blue },
        horzLine: { color: theme.blue, width: 1, style: LineStyle.Dashed, labelBackgroundColor: theme.blue },
      },
      rightPriceScale: { visible: true, borderColor: theme.border, autoScale: store.autoScale, mode: store.priceMode === "percentage" ? PriceScaleMode.Percentage : PriceScaleMode.Normal },
      leftPriceScale: { visible: store.leftScale, borderColor: theme.border, autoScale: store.autoScale },
      timeScale: { borderColor: theme.border, rightOffset: 8, barSpacing: 7, minBarSpacing: 2, fixLeftEdge: false, lockVisibleTimeRangeOnResize: true, timeVisible: true, secondsVisible: false },
      handleScale: { axisPressedMouseMove: true, axisDoubleClickReset: true, mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
    });
    chartRef.current = chart;
    const resize = () => chart.applyOptions({ width: element.clientWidth, height: typeof height === "number" ? height : element.clientHeight });
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const crosshairHandler = (param: { time?: unknown; point?: { x: number; y: number }; seriesData: Map<unknown, unknown> }) => {
      const current = seriesRef.current;
      const data = current ? param.seriesData.get(current) as { close?: number; value?: number } | undefined : undefined;
      setCrosshair({ time: typeof param.time === "number" ? param.time : undefined, price: data?.close ?? data?.value, index: param.point?.x });
    };
    chart.subscribeCrosshairMove(crosshairHandler);
    return () => { observer.disconnect(); chart.unsubscribeCrosshairMove(crosshairHandler); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [height, store.autoScale, store.leftScale, store.magnet, store.priceMode, theme.background, theme.blue, theme.border, theme.grid, theme.text]);

  const seriesData = useMemo(() => {
    const source = store.chartType === "heikin" ? toHeikin(candles) : candles;
    return source;
  }, [candles, store.chartType]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (seriesRef.current) { chart.removeSeries(seriesRef.current); seriesRef.current = null; }
    const common = { priceLineVisible: true, lastValueVisible: true };
    let series: ISeriesApi<any>;
    if (store.chartType === "candles" || store.chartType === "hollow" || store.chartType === "heikin") {
      series = chart.addCandlestickSeries({ ...common, upColor: store.chartType === "hollow" ? "transparent" : theme.up, downColor: store.chartType === "hollow" ? "transparent" : theme.down, borderUpColor: theme.up, borderDownColor: theme.down, wickUpColor: theme.up, wickDownColor: theme.down });
      series.setData(seriesData.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })) as CandlestickData[]);
    } else if (store.chartType === "bar") {
      series = chart.addBarSeries({ ...common, upColor: theme.up, downColor: theme.down });
      series.setData(seriesData.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })));
    } else if (store.chartType === "area") {
      series = chart.addAreaSeries({ ...common, lineColor: theme.blue, topColor: `${theme.blue}55`, bottomColor: `${theme.blue}05`, lineWidth: 2 });
      series.setData(seriesData.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })));
    } else if (store.chartType === "baseline") {
      series = chart.addBaselineSeries({ ...common, baseValue: { type: "price", price: seriesData.at(-1)?.close ?? 0 }, topLineColor: theme.up, topFillColor1: `${theme.up}35`, topFillColor2: `${theme.up}05`, bottomLineColor: theme.down, bottomFillColor1: `${theme.down}05`, bottomFillColor2: `${theme.down}35` });
      series.setData(seriesData.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })));
    } else {
      series = chart.addLineSeries({ ...common, color: theme.blue, lineWidth: 2 });
      series.setData(seriesData.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })));
    }
    seriesRef.current = series;
    chart.timeScale().fitContent();
  }, [seriesData, store.chartType, theme.blue, theme.down, theme.up]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !seriesRef.current) return;
    chart.applyOptions({
      crosshair: { mode: store.magnet ? CrosshairMode.Magnet : CrosshairMode.Normal },
      rightPriceScale: { autoScale: store.autoScale, mode: store.priceMode === "percentage" ? PriceScaleMode.Percentage : PriceScaleMode.Normal },
      leftPriceScale: { visible: store.leftScale },
    });
  }, [store.autoScale, store.leftScale, store.magnet, store.priceMode]);

  const closeValues = useMemo(() => candles.map((c) => c.close), [candles]);
  const indicatorSeries = useMemo(() => {
    const enabled = store.indicators.filter((item) => item.enabled);
    const map: Record<string, Array<{ time: number; value: number }>> = {};
    for (const item of enabled) {
      if (item.kind === "sma") map[item.id] = sma(closeValues, item.period ?? 20).map((value, i) => ({ time: candles[i]?.time ?? 0, value })).filter((x) => finite(x.value));
      if (item.kind === "ema") map[item.id] = ema(closeValues, item.period ?? 50).map((value, i) => ({ time: candles[i]?.time ?? 0, value })).filter((x) => finite(x.value));
      if (item.kind === "wma") map[item.id] = wma(closeValues, item.period ?? 20).map((value, i) => ({ time: candles[i]?.time ?? 0, value })).filter((x) => finite(x.value));
      if (item.kind === "vwap") map[item.id] = vwap(candles);
      if (item.kind === "atr") map[item.id] = atr(candles, item.period ?? 14).map((value, i) => ({ time: candles[i]?.time ?? 0, value })).filter((x) => finite(x.value));
      if (item.kind === "rsi") map[item.id] = rsi(closeValues, item.period ?? 14).map((value, i) => ({ time: candles[i]?.time ?? 0, value })).filter((x) => finite(x.value));
    }
    return map;
  }, [candles, closeValues, store.indicators]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const created: ISeriesApi<"Line">[] = [];
    const colors = [theme.blue, theme.orange, "#b38cff", "#57b6f2", "#e7d35c", "#f06a9b"];
    Object.entries(indicatorSeries).forEach(([id, data], index) => {
      const series = chart.addLineSeries({ color: colors[index % colors.length], lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
      series.setData(data.map((point) => ({ time: point.time as UTCTimestamp, value: point.value })));
      created.push(series);
    });
    return () => created.forEach((series) => chart.removeSeries(series));
  }, [indicatorSeries, theme.blue, theme.orange]);

  const activeIndicators = useMemo(() => store.indicators.filter((i) => i.enabled), [store.indicators]);
  const last = candles.at(-1);
  const prev = candles.at(-2);
  const change = last && prev ? last.close - prev.close : 0;
  const changePct = prev?.close ? (change / prev.close) * 100 : 0;

  const addDrawingPoint = useCallback((tool: DrawingTool, x: number, y: number) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || tool === "cursor") return;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (time == null || price == null) return;
    const point = { time: Number(time), price: Number(price) };
    const existing = store.drawings.find((item) => item.id === "draft");
    if (!existing || existing.type !== tool) {
      setStore({ drawings: [...store.drawings, { id: `draft-${Date.now()}`, type: tool, points: [point], text: tool === "text" ? "Annotation" : undefined }], activeTool: tool });
      return;
    }
    const next = existing.points.length >= 2 ? [point] : [...existing.points, point];
    setStore({ drawings: store.drawings.map((item) => item.id === existing.id ? { ...item, points: next } : item), activeTool: next.length >= 2 ? "cursor" : tool });
  }, [setStore, store.drawings]);

  const finishDrawingOnDoubleClick = useCallback(() => {
    const draft = store.drawings.find((item) => item.id.startsWith("draft-"));
    if (!draft) return;
    setStore({ drawings: store.drawings.map((item) => item.id === draft.id ? { ...item, id: `${draft.type}-${Date.now()}` } : item), activeTool: "cursor" });
  }, [setStore, store.drawings]);

  useEffect(() => {
    const element = overlayRef.current;
    if (!element) return;
    const onPointerDown = (event: PointerEvent) => {
      if (store.activeTool === "cursor") return;
      const rect = element.getBoundingClientRect();
      addDrawingPoint(store.activeTool, event.clientX - rect.left, event.clientY - rect.top);
    };
    element.addEventListener("pointerdown", onPointerDown);
    return () => element.removeEventListener("pointerdown", onPointerDown);
  }, [addDrawingPoint, store.activeTool]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (event.key === "Delete" && selectedDrawing) { store.removeDrawing(selectedDrawing); setSelectedDrawing(null); }
      if (event.key === "Escape") { setStore({ activeTool: "cursor" }); setMenu(null); setIndicatorMenu(false); setDrawingMenu(false); }
      if (event.key.toLowerCase() === "f") setStore({ activeTool: "fib" });
      if (event.key.toLowerCase() === "h") setStore({ activeTool: "horizontal" });
      if (event.key.toLowerCase() === "t") setStore({ activeTool: "trend" });
      if (event.key.toLowerCase() === "v") setStore({ activeTool: "cursor" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDrawing, setStore, store]);

  const drawingGeometry = useMemo(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return [];
    const width = overlayRef.current?.clientWidth ?? 0;
    const heightPx = overlayRef.current?.clientHeight ?? 0;
    return store.drawings.map((drawing) => {
      const points = drawing.points.map((point) => ({ x: chart.timeScale().timeToCoordinate(point.time as UTCTimestamp), y: series.priceToCoordinate(point.price) })).filter((point): point is { x: number; y: number } => point.x != null && point.y != null);
      return { drawing, points, width, height: heightPx };
    });
  }, [candles, crosshair, store.drawings, store.timeframe, store.chartType]);

  const submitSymbol = () => {
    const next = search.trim().toUpperCase();
    if (!next) return;
    setStore({ symbol: next });
    onSymbolChange?.(next);
    void loadHistory(store.timeframe, next);
  };

  const menuAction = (action: string) => {
    if (action === "reset") chartRef.current?.timeScale().fitContent();
    if (action === "delete") { if (selectedDrawing) store.removeDrawing(selectedDrawing); else setStore({ drawings: [] }); }
    if (action === "auto") setStore({ autoScale: true });
    if (action === "percent") setStore({ priceMode: store.priceMode === "normal" ? "percentage" : "normal" });
    setMenu(null);
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`w-full overflow-hidden rounded-2xl border shadow-2xl ${className}`} style={{ background: theme.panel, borderColor: theme.border }} onContextMenu={(event) => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }); }}>
      <div className="flex min-h-12 flex-wrap items-center gap-1 border-b px-2 py-1.5" style={{ borderColor: theme.border, color: theme.text }}>
        <form className="flex items-center gap-2 rounded-lg border px-2 py-1" style={{ borderColor: theme.border, background: theme.background }} onSubmit={(e) => { e.preventDefault(); submitSymbol(); }}>
          <span className="text-xs font-semibold tracking-wide">◈</span>
          <input aria-label="Symbol" value={search} onChange={(e) => setSearch(e.target.value)} className="w-24 bg-transparent text-xs font-semibold outline-none" />
        </form>
        <div className="mx-1 hidden h-6 w-px md:block" style={{ background: theme.border }} />
        <div className="flex max-w-full overflow-x-auto scrollbar-none">
          {TIMEFRAMES.map((frame) => <button key={frame} onClick={() => { setStore({ timeframe: frame }); void loadHistory(frame, symbol); }} className="rounded px-2 py-1.5 text-[11px] font-semibold transition-colors" style={{ color: store.timeframe === frame ? theme.blue : theme.text, background: store.timeframe === frame ? `${theme.blue}16` : "transparent" }}>{frame}</button>)}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setIndicatorMenu((v) => !v)} className="rounded px-2 py-1.5 text-xs font-semibold hover:bg-white/5">Indicators</button>
            <AnimatePresence>{indicatorMenu && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-9 z-50 w-64 rounded-xl border p-2 shadow-2xl" style={{ background: theme.panel, borderColor: theme.border }}>
              {store.indicators.map((indicator) => <button key={indicator.id} onClick={() => store.toggleIndicator(indicator.kind)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5"><span>{indicator.kind.toUpperCase()}</span><span style={{ color: indicator.enabled ? theme.blue : theme.text }}>{indicator.enabled ? "ON" : "OFF"}</span></button>)}
            </motion.div>}</AnimatePresence>
          </div>
          <div className="relative">
            <button onClick={() => setDrawingMenu((v) => !v)} className="rounded px-2 py-1.5 text-xs font-semibold">Draw</button>
            <AnimatePresence>{drawingMenu && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-9 z-50 w-48 rounded-xl border p-2 shadow-2xl" style={{ background: theme.panel, borderColor: theme.border }}>
              {DRAWING_TOOLS.map(([tool, label]) => <button key={tool} onClick={() => { setStore({ activeTool: tool }); setDrawingMenu(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5"><span className="w-4 text-center">{iconFor(tool)}</span>{label}</button>)}
              <button onClick={() => { store.resetDrawings(); setDrawingMenu(false); }} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-white/5">Clear drawings</button>
            </motion.div>}</AnimatePresence>
          </div>
          <button onClick={() => setStore({ magnet: !store.magnet })} className="rounded px-2 py-1.5 text-xs" style={{ color: store.magnet ? theme.blue : theme.text }}>Magnet</button>
          <button onClick={() => setStore({ theme: store.theme === "dark" ? "light" : "dark" })} className="rounded px-2 py-1.5 text-xs">{store.theme === "dark" ? "☼" : "☾"}</button>
          <button onClick={() => { const next = !store.fullscreen; setStore({ fullscreen: next }); if (next) void containerRef.current?.requestFullscreen(); else if (document.fullscreenElement) void document.exitFullscreen(); }} className="rounded px-2 py-1.5 text-xs">⛶</button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b px-3 py-2 text-[11px]" style={{ borderColor: theme.border, color: theme.text }}>
        <strong style={{ color: theme.theme === "dark" ? "#fff" : "#111827" }}>{symbol}</strong>
        <span>{store.timeframe}</span>
        {last && <><span>O <b>{formatPrice(last.open)}</b></span><span>H <b>{formatPrice(last.high)}</b></span><span>L <b>{formatPrice(last.low)}</b></span><span>C <b>{formatPrice(last.close)}</b></span><span style={{ color: change >= 0 ? theme.up : theme.down }}>{change >= 0 ? "+" : ""}{formatPrice(change)} ({changePct.toFixed(2)}%)</span></>}
        {crosshair?.price != null && <span className="ml-auto hidden md:inline">Crosshair {formatPrice(crosshair.price)}</span>}
      </div>

      <div ref={containerRef} className="relative w-full" style={{ height: typeof height === "number" ? height : height, background: theme.background }}>
        {loading && <div className="absolute inset-0 z-20 animate-pulse" style={{ background: `linear-gradient(110deg, transparent 20%, ${theme.border} 45%, transparent 70%)` }} aria-label="Loading chart" />}
        {!loading && candles.length === 0 && <div className="absolute inset-0 z-10 grid place-items-center"><div className="text-center"><div className="mb-2 text-2xl">◌</div><p className="text-sm font-semibold">No market data</p><p className="mt-1 text-xs opacity-60">Connect a historical feed or pass initialData.</p></div></div>}
        {error && <div className="absolute left-3 top-3 z-30 rounded-lg border px-3 py-2 text-xs" style={{ background: theme.panel, borderColor: theme.down, color: theme.down }}>{error}</div>}
        <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-10" onDoubleClick={finishDrawingOnDoubleClick}>
          <svg width="100%" height="100%" className="overflow-visible">
            {drawingGeometry.map(({ drawing, points, width, height: h }) => {
              const selected = selectedDrawing === drawing.id;
              const stroke = selected ? theme.blue : theme.orange;
              const hit = (onPointerDown: (event: React.PointerEvent<SVGElement>) => void) => ({ onPointerDown, style: { pointerEvents: "stroke", cursor: "move" } as React.CSSProperties });
              if (drawing.type === "horizontal" && points[0]) return <g key={drawing.id}><line x1={0} x2={width} y1={points[0].y} y2={points[0].y} stroke={stroke} strokeWidth={selected ? 2 : 1} strokeDasharray="5 4" {...hit((e) => { e.stopPropagation(); setSelectedDrawing(drawing.id); })} /></g>;
              if (drawing.type === "vertical" && points[0]) return <g key={drawing.id}><line x1={points[0].x} x2={points[0].x} y1={0} y2={h} stroke={stroke} strokeWidth={selected ? 2 : 1} strokeDasharray="5 4" {...hit((e) => { e.stopPropagation(); setSelectedDrawing(drawing.id); })} /></g>;
              if (points.length < 1) return null;
              if (drawing.type === "text") return <text key={drawing.id} x={points[0].x} y={points[0].y} fill={stroke} fontSize="13" {...hit((e) => { e.stopPropagation(); setSelectedDrawing(drawing.id); })}>{drawing.text || "Annotation"}</text>;
              if (drawing.type === "rectangle" && points.length >= 2) return <rect key={drawing.id} x={Math.min(points[0].x, points[1].x)} y={Math.min(points[0].y, points[1].y)} width={Math.abs(points[1].x - points[0].x)} height={Math.abs(points[1].y - points[0].y)} fill={`${stroke}12`} stroke={stroke} strokeWidth={selected ? 2 : 1} {...hit((e) => { e.stopPropagation(); setSelectedDrawing(drawing.id); })} />;
              if (drawing.type === "fib" && points.length >= 2) {
                const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.71, 0.786, 0.95, 1];
                const y0 = points[0].y, y1 = points[1].y;
                return <g key={drawing.id}>{levels.map((level) => { const y = y0 + (y1 - y0) * level; return <g key={level}><line x1={Math.min(points[0].x, points[1].x)} x2={Math.max(points[0].x, points[1].x)} y1={y} y2={y} stroke={level === 0.71 ? theme.blue : stroke} strokeWidth={level === 0.71 ? 2 : 1} /><text x={Math.max(points[0].x, points[1].x) + 5} y={y - 2} fill={level === 0.71 ? theme.blue : stroke} fontSize="9">{level.toFixed(3)}</text></g>; })}</g>;
              }
              if (points.length >= 2) {
                const [a, b] = points;
                const rayEnd = drawing.type === "ray" ? width : b.x;
                const yEnd = drawing.type === "ray" && b.x !== a.x ? a.y + ((b.y - a.y) / (b.x - a.x)) * (rayEnd - a.x) : b.y;
                return <line key={drawing.id} x1={a.x} y1={a.y} x2={rayEnd} y2={yEnd} stroke={stroke} strokeWidth={selected ? 2 : 1.5} {...hit((e) => { e.stopPropagation(); setSelectedDrawing(drawing.id); })} />;
              }
              return null;
            })}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t px-3 py-2 text-[10px]" style={{ borderColor: theme.border, color: theme.text }}>
        <span className="font-semibold">{activeIndicators.length ? activeIndicators.map((i) => i.kind.toUpperCase()).join(" · ") : "No indicators"}</span>
        <span className="ml-auto">10k candle cap · local drawings · {store.priceMode === "normal" ? "Price" : "%"}</span>
      </div>

      {menu && <div className="fixed z-[100] w-52 rounded-xl border p-1.5 shadow-2xl" style={{ left: menu.x, top: menu.y, background: theme.panel, borderColor: theme.border }}>
        {[['reset', 'Reset chart'], ['auto', 'Auto scale'], ['percent', store.priceMode === "normal" ? "Percentage scale" : "Normal scale"], ['delete', selectedDrawing ? "Delete selected drawing" : "Clear drawings']].map(([key, label]) => <button key={key} onClick={() => menuAction(key)} className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5">{label}</button>)}
      </div>}
    </motion.section>
  );
}

export { mockCandles };
