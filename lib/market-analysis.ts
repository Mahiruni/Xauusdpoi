export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type TimeframeAnalysis = {
  timeframe: string;
  candles: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL" | "UNKNOWN";
  structure: "BULLISH" | "BEARISH" | "SHIFT" | "RANGE" | "UNKNOWN";
  swingHigh: number | null;
  swingLow: number | null;
  displacement: "UP" | "DOWN" | "NONE";
  confidence: number;
};

function finiteCandles(candles: Candle[]) {
  return candles.filter((c) => [c.open, c.high, c.low, c.close].every(Number.isFinite));
}

function highest(candles: Candle[]) {
  return candles.reduce((v, c) => Math.max(v, c.high), -Infinity);
}

function lowest(candles: Candle[]) {
  return candles.reduce((v, c) => Math.min(v, c.low), Infinity);
}

export function analyzeTimeframe(timeframe: string, input: Candle[]): TimeframeAnalysis {
  const candles = finiteCandles(input);
  if (candles.length < 10) {
    return { timeframe, candles: candles.length, trend: "UNKNOWN", structure: "UNKNOWN", swingHigh: null, swingLow: null, displacement: "NONE", confidence: 0 };
  }

  const recent = candles.slice(-20);
  const half = Math.max(3, Math.floor(recent.length / 2));
  const first = recent.slice(0, half);
  const second = recent.slice(half);
  const firstClose = first[first.length - 1].close;
  const lastClose = second[second.length - 1].close;
  const slope = firstClose ? (lastClose - firstClose) / firstClose : 0;
  const range = Math.max(highest(recent) - lowest(recent), 0.0001);
  const body = Math.abs(lastClose - recent[recent.length - 1].open);
  const displacement = body / range > 0.18 ? (lastClose > recent[recent.length - 1].open ? "UP" : "DOWN") : "NONE";

  const prior = candles.slice(-10, -3);
  const current = candles.slice(-3);
  const priorHigh = highest(prior);
  const priorLow = lowest(prior);
  const currentHigh = highest(current);
  const currentLow = lowest(current);

  let structure: TimeframeAnalysis["structure"] = "RANGE";
  if (currentHigh > priorHigh && currentLow >= priorLow) structure = "BULLISH";
  if (currentLow < priorLow && currentHigh <= priorHigh) structure = "BEARISH";
  if (currentHigh > priorHigh && currentLow < priorLow) {
    structure = lastClose > (priorHigh + priorLow) / 2 ? "SHIFT" : "SHIFT";
  }

  const trend: TimeframeAnalysis["trend"] = slope > 0.0015 ? "BULLISH" : slope < -0.0015 ? "BEARISH" : "NEUTRAL";
  const confidence = Math.min(100, Math.round(45 + Math.abs(slope) * 10000 + (structure === "RANGE" ? 0 : 20)));

  return {
    timeframe,
    candles: candles.length,
    trend,
    structure,
    swingHigh: highest(candles.slice(-30)),
    swingLow: lowest(candles.slice(-30)),
    displacement,
    confidence,
  };
}

export function calculateFib(direction: "BULLISH" | "BEARISH", swingLow: number, swingHigh: number) {
  const range = swingHigh - swingLow;
  if (!Number.isFinite(range) || range <= 0) return null;
  const price = (level: number) => direction === "BULLISH" ? swingLow + range * level : swingHigh - range * level;
  return {
    direction,
    swingLow,
    swingHigh,
    stop: price(0.95),
    poi: price(0.71),
    tp1: price(0),
    tp2: price(-0.21),
  };
}

export function detectLiquiditySweep(candles: Candle[], poi: number, stop: number, direction: "BULLISH" | "BEARISH") {
  const recent = finiteCandles(candles).slice(-20);
  if (!recent.length) return { swept: false, type: "NONE" as const };
  const inside = recent.filter((c) => direction === "BEARISH" ? c.high >= poi && c.high <= stop : c.low <= poi && c.low >= stop);
  if (!inside.length) return { swept: false, type: "NONE" as const };

  if (direction === "BEARISH") {
    const localHigh = highest(inside);
    const rejected = inside.some((c) => c.high === localHigh && c.close < c.open);
    return { swept: rejected, type: rejected ? "INTERNAL_HIGH" as const : "NONE" as const };
  }

  const localLow = lowest(inside);
  const rejected = inside.some((c) => c.low === localLow && c.close > c.open);
  return { swept: rejected, type: rejected ? "INTERNAL_LOW" as const : "NONE" as const };
}
