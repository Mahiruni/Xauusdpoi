import { analyzeTimeframe, calculateFib, detectLiquiditySweep, type Candle } from "@/lib/market-analysis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const SYMBOL = "XAU/USD";
const TIMEFRAMES = [
  ["1week", "W1", 120],
  ["1day", "D1", 180],
  ["4h", "H4", 180],
  ["1h", "H1", 240],
  ["15min", "M15", 240],
  ["5min", "M5", 240],
] as const;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

async function series(apiKey: string, interval: string, outputsize: number): Promise<Candle[]> {
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", SYMBOL);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("format", "JSON");
  url.searchParams.set("apikey", apiKey);
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json() as { values?: Array<Record<string, string>>; message?: string };
  if (!response.ok || !Array.isArray(data.values)) throw new Error(data.message || `Twelve Data ${interval} request failed`);
  return [...data.values].reverse().map((c) => ({ time: c.datetime, open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close) }))
    .filter((c) => [c.open, c.high, c.low, c.close].every(Number.isFinite));
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY;
  if (!apiKey) return json({ live: false, configured: false, symbol: SYMBOL, status: "UNKNOWN", message: "Twelve Data is not configured." });

  try {
    const results = await Promise.all(TIMEFRAMES.map(async ([interval, label, size]) => {
      const candles = await series(apiKey, interval, size);
      return { interval, label, candles, analysis: analyzeTimeframe(label, candles) };
    }));

    const weekly = results.find((r) => r.label === "W1")!;
    const daily = results.find((r) => r.label === "D1")!;
    const h4 = results.find((r) => r.label === "H4")!;
    const h1 = results.find((r) => r.label === "H1")!;
    const m15 = results.find((r) => r.label === "M15")!;
    const m5 = results.find((r) => r.label === "M5")!;
    const current = m5.candles.at(-1)?.close ?? m15.candles.at(-1)?.close ?? h1.candles.at(-1)?.close ?? null;

    const macro = weekly.analysis.trend === daily.analysis.trend && weekly.analysis.trend !== "NEUTRAL" ? weekly.analysis.trend : "UNKNOWN";
    const direction = macro === "BULLISH" || macro === "BEARISH" ? macro : null;
    const htfStructureAligned = direction ? [h4.analysis.structure, h1.analysis.structure].some((s) => s === direction || s === "SHIFT") : false;
    const anchor = direction ? calculateFib(direction, Math.min(h1.analysis.swingLow ?? Infinity, h4.analysis.swingLow ?? Infinity), Math.max(h1.analysis.swingHigh ?? -Infinity, h4.analysis.swingHigh ?? -Infinity)) : null;
    const sweep = anchor ? detectLiquiditySweep(m15.candles, anchor.poi, anchor.stop, direction!) : { swept: false, type: "NONE" as const };

    let status: "CONFIRMED" | "DEVELOPING" | "WAIT" | "INVALID" | "UNKNOWN" = "UNKNOWN";
    const reasons: string[] = [];
    if (!direction) reasons.push("Weekly and Daily do not provide aligned directional bias.");
    else reasons.push(`Weekly/Daily bias is ${direction}.`);
    if (!htfStructureAligned) reasons.push("No aligned H4/H1 structure shift is verified yet.");
    else reasons.push("H4/H1 structure is compatible with the macro direction.");
    if (!anchor) reasons.push("A valid Fibonacci impulse anchor cannot be established from the current sample.");
    if (anchor && current !== null) {
      const inPoi = direction === "BEARISH" ? current <= anchor.poi && current >= anchor.stop : current >= anchor.poi && current <= anchor.stop;
      if (!inPoi) reasons.push("Price is outside the 0.71 POI zone.");
      else reasons.push("Price is inside the 0.71–0.95 POI/stop reference zone.");
      if (inPoi && sweep.swept) reasons.push(`Internal liquidity sweep detected (${sweep.type}).`);
      if (inPoi && !sweep.swept) reasons.push("Required internal liquidity sweep is still pending.");
    }

    if (direction && htfStructureAligned && anchor) {
      const inPoi = direction === "BEARISH" ? current !== null && current <= anchor.poi && current >= anchor.stop : current !== null && current >= anchor.poi && current <= anchor.stop;
      status = inPoi && sweep.swept ? "CONFIRMED" : inPoi ? "WAIT" : "DEVELOPING";
    }

    return json({
      live: true,
      configured: true,
      symbol: SYMBOL,
      provider: "Twelve Data",
      current,
      status,
      direction,
      reasons,
      fibonacci: anchor,
      liquidity: sweep,
      timeframes: results.map((r) => ({ ...r.analysis, interval: r.interval })),
      execution: { m15: m15.analysis, m5: m5.analysis },
      updatedAt: m5.candles.at(-1)?.time ?? m15.candles.at(-1)?.time ?? new Date().toISOString(),
      rules: { poi: 0.71, stop: 0.95, tp1: 0, tp2: -0.21 },
    });
  } catch (error) {
    return json({ live: false, configured: true, symbol: SYMBOL, status: "UNKNOWN", message: error instanceof Error ? error.message : "Market analysis failed." }, 502);
  }
}
