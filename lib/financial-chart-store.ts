import { create } from "zustand";

export type ChartType = "candles" | "hollow" | "heikin" | "line" | "area" | "bar" | "baseline";
export type Timeframe = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1D" | "1W" | "1M";
export type ThemeMode = "dark" | "light";
export type PriceMode = "normal" | "percentage";
export type DrawingTool = "cursor" | "trend" | "horizontal" | "vertical" | "ray" | "fib" | "rectangle" | "text";

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorConfig {
  id: string;
  kind: "sma" | "ema" | "wma" | "bollinger" | "rsi" | "macd" | "volume-profile" | "vwap" | "stochastic" | "atr";
  period?: number;
  fast?: number;
  slow?: number;
  signal?: number;
  stdDev?: number;
  enabled: boolean;
}

export interface Drawing {
  id: string;
  type: Exclude<DrawingTool, "cursor">;
  points: Array<{ time: number; price: number }>;
  text?: string;
}

interface ChartState {
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  theme: ThemeMode;
  priceMode: PriceMode;
  magnet: boolean;
  leftScale: boolean;
  autoScale: boolean;
  showVolume: boolean;
  fullscreen: boolean;
  activeTool: DrawingTool;
  indicators: IndicatorConfig[];
  drawings: Drawing[];
  set: (patch: Partial<ChartState>) => void;
  toggleIndicator: (kind: IndicatorConfig["kind"]) => void;
  addIndicator: (indicator: IndicatorConfig) => void;
  removeIndicator: (id: string) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  removeDrawing: (id: string) => void;
  resetDrawings: () => void;
}

const defaults: IndicatorConfig[] = [
  { id: "sma-20", kind: "sma", period: 20, enabled: true },
  { id: "ema-50", kind: "ema", period: 50, enabled: false },
  { id: "bollinger-20", kind: "bollinger", period: 20, stdDev: 2, enabled: false },
  { id: "rsi-14", kind: "rsi", period: 14, enabled: false },
  { id: "macd-12-26", kind: "macd", fast: 12, slow: 26, signal: 9, enabled: false },
  { id: "volume-profile", kind: "volume-profile", period: 48, enabled: false },
  { id: "vwap", kind: "vwap", enabled: false },
  { id: "stoch-14", kind: "stochastic", period: 14, signal: 3, enabled: false },
  { id: "atr-14", kind: "atr", period: 14, enabled: false },
];

export const useFinancialChartStore = create<ChartState>((set) => ({
  symbol: "XAU/USD",
  timeframe: "15m",
  chartType: "candles",
  theme: "dark",
  priceMode: "normal",
  magnet: true,
  leftScale: false,
  autoScale: true,
  showVolume: true,
  fullscreen: false,
  activeTool: "cursor",
  indicators: defaults,
  drawings: [],
  set: (patch) => set(patch),
  toggleIndicator: (kind) => set((state) => ({
    indicators: state.indicators.map((item) => item.kind === kind ? { ...item, enabled: !item.enabled } : item),
  })),
  addIndicator: (indicator) => set((state) => ({ indicators: [...state.indicators, indicator] })),
  removeIndicator: (id) => set((state) => ({ indicators: state.indicators.filter((item) => item.id !== id) })),
  addDrawing: (drawing) => set((state) => ({ drawings: [...state.drawings, drawing] })),
  updateDrawing: (id, patch) => set((state) => ({ drawings: state.drawings.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  removeDrawing: (id) => set((state) => ({ drawings: state.drawings.filter((item) => item.id !== id) })),
  resetDrawings: () => set({ drawings: [] }),
}));
