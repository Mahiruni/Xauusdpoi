import type { ChartCandle } from "./financial-chart-store";

export interface Point { time: number; value: number }
export interface Band { time: number; upper: number; middle: number; lower: number }
export interface MacdPoint { time: number; macd: number; signal: number; histogram: number }

export function sma(values: number[], period: number): number[] {
  const out = Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out = Array(values.length).fill(NaN);
  const alpha = 2 / (period + 1);
  let previous = values[0] ?? NaN;
  for (let i = 0; i < values.length; i += 1) {
    if (i === period - 1) {
      previous = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out[i] = previous;
    } else if (i >= period) {
      previous = values[i] * alpha + previous * (1 - alpha);
      out[i] = previous;
    }
  }
  return out;
}

export function wma(values: number[], period: number): number[] {
  const out = Array(values.length).fill(NaN);
  const denominator = (period * (period + 1)) / 2;
  for (let i = period - 1; i < values.length; i += 1) {
    let weighted = 0;
    for (let j = 0; j < period; j += 1) weighted += values[i - j] * (period - j);
    out[i] = weighted / denominator;
  }
  return out;
}

export function bollinger(values: number[], period = 20, multiplier = 2): Band[] {
  const middle = sma(values, period);
  return values.map((_, i) => {
    if (!Number.isFinite(middle[i])) return { time: 0, upper: NaN, middle: NaN, lower: NaN };
    const window = values.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    const deviation = Math.sqrt(variance) * multiplier;
    return { time: 0, upper: mean + deviation, middle: mean, lower: mean - deviation };
  });
}

export function trueRanges(candles: ChartCandle[]): number[] {
  return candles.map((candle, index) => {
    if (index === 0) return candle.high - candle.low;
    const previous = candles[index - 1].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previous), Math.abs(candle.low - previous));
  });
}

export function atr(candles: ChartCandle[], period = 14): number[] {
  return ema(trueRanges(candles), period);
}

export function rsi(values: number[], period = 14): number[] {
  const out = Array(values.length).fill(NaN);
  if (values.length <= period) return out;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = values[i] - values[i - 1];
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function macd(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MacdPoint[] {
  const fast = ema(values, fastPeriod);
  const slow = ema(values, slowPeriod);
  const raw = values.map((_, i) => Number.isFinite(fast[i]) && Number.isFinite(slow[i]) ? fast[i] - slow[i] : NaN);
  const signal = ema(raw.map((value) => Number.isFinite(value) ? value : 0), signalPeriod);
  return values.map((_, i) => ({ time: 0, macd: raw[i], signal: signal[i], histogram: raw[i] - signal[i] }));
}

export function stochastic(candles: ChartCandle[], period = 14, signalPeriod = 3): { time: number; k: number; d: number }[] {
  const k = candles.map((candle, i) => {
    if (i < period - 1) return NaN;
    const window = candles.slice(i - period + 1, i + 1);
    const high = Math.max(...window.map((x) => x.high));
    const low = Math.min(...window.map((x) => x.low));
    return high === low ? 50 : ((candle.close - low) / (high - low)) * 100;
  });
  const d = sma(k.map((x) => Number.isFinite(x) ? x : 0), signalPeriod);
  return candles.map((candle, i) => ({ time: candle.time, k: k[i], d: d[i] }));
}

export function vwap(candles: ChartCandle[]): Point[] {
  let cumulativeVolume = 0;
  let cumulativePriceVolume = 0;
  return candles.map((candle) => {
    const volume = candle.volume ?? 0;
    const typical = (candle.high + candle.low + candle.close) / 3;
    cumulativeVolume += volume;
    cumulativePriceVolume += typical * volume;
    return { time: candle.time, value: cumulativeVolume ? cumulativePriceVolume / cumulativeVolume : typical };
  });
}
