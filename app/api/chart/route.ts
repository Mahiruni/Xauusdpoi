import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const intervals: Record<string, string> = {
  "1m": "1min", "3m": "3min", "5m": "5min", "15m": "15min", "30m": "30min",
  "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "12h": "12h",
  "1D": "1day", "1W": "1week", "1M": "1month",
};

const MAX_CANDLES = 5000;

export async function GET(request: NextRequest) {
  const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY;
  const symbol = request.nextUrl.searchParams.get("symbol") || "XAU/USD";
  const timeframe = request.nextUrl.searchParams.get("timeframe") || "15m";
  const interval = intervals[timeframe];
  const requested = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 1000), 100), MAX_CANDLES);

  if (!apiKey) {
    return NextResponse.json({ ok: false, configured: false, candles: [], message: "Market data provider is not configured." }, { status: 503 });
  }
  if (!interval) {
    return NextResponse.json({ ok: false, configured: true, candles: [], message: "Unsupported timeframe." }, { status: 400 });
  }

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(requested));
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload.status === "error") {
      return NextResponse.json({ ok: false, configured: true, candles: [], message: payload.message || "Market data provider error." }, { status: 502 });
    }
    const candles = (payload.values ?? []).map((row: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }, index: number) => {
      const timestamp = Date.parse(row.datetime.includes("T") ? row.datetime : `${row.datetime}T00:00:00Z`) / 1000;
      return {
        time: Number.isFinite(timestamp) ? timestamp : index,
        open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close),
        volume: row.volume == null ? undefined : Number(row.volume),
      };
    }).filter((candle: { time: number; open: number; high: number; low: number; close: number }) => Object.values(candle).slice(1).every(Number.isFinite)).reverse();

    return NextResponse.json({ ok: true, configured: true, provider: "Twelve Data", symbol, timeframe, candles, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, configured: true, candles: [], message: "Unable to reach market data provider." }, { status: 502 });
  }
}
