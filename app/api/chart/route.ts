import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const intervals: Record<string, string> = { "1m": "1min", "3m": "3min", "5m": "5min", "15m": "15min", "30m": "30min", "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "12h": "12h", "1D": "1day", "1W": "1week", "1M": "1month" };
const MAX_CANDLES = 5000;

type Quote = { price?: string; message?: string };

export async function GET(request: NextRequest) {
  const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY;
  const symbol = request.nextUrl.searchParams.get("symbol") || "XAU/USD";
  const timeframe = request.nextUrl.searchParams.get("timeframe") || "15m";
  const interval = intervals[timeframe];
  const requested = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 1000), 100), MAX_CANDLES);
  if (!apiKey) return NextResponse.json({ ok: false, configured: false, candles: [], message: "Market data provider is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!interval) return NextResponse.json({ ok: false, configured: true, candles: [], message: "Unsupported timeframe." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol); url.searchParams.set("interval", interval); url.searchParams.set("outputsize", String(requested)); url.searchParams.set("apikey", apiKey); url.searchParams.set("format", "JSON");
  const quoteUrl = new URL("https://api.twelvedata.com/price");
  quoteUrl.searchParams.set("symbol", symbol); quoteUrl.searchParams.set("apikey", apiKey);

  try {
    const [response, quoteResponse] = await Promise.all([fetch(url, { cache: "no-store" }), fetch(quoteUrl, { cache: "no-store" })]);
    const payload = await response.json();
    const quotePayload = await quoteResponse.json() as Quote;
    if (!response.ok || payload.status === "error") return NextResponse.json({ ok: false, configured: true, candles: [], message: payload.message || "Market data provider error." }, { status: 502, headers: { "Cache-Control": "no-store" } });
    const candles = (payload.values ?? []).map((row: { datetime: string; open: string; high: string; low: string; close: string }, index: number) => {
      const timestamp = Date.parse(row.datetime.includes("T") ? row.datetime : `${row.datetime}T00:00:00Z`) / 1000;
      return { time: Number.isFinite(timestamp) ? timestamp : index, open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close) };
    }).filter((candle: { time: number; open: number; high: number; low: number; close: number }) => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)).reverse();

    const exactQuote = Number(quotePayload.price);
    if (Number.isFinite(exactQuote) && candles.length && symbol.toUpperCase().replace(/\s/g, "") === "XAU/USD") {
      const last = candles[candles.length - 1];
      last.close = exactQuote; last.high = Math.max(last.high, exactQuote); last.low = Math.min(last.low, exactQuote);
    }
    return NextResponse.json({ ok: true, configured: true, liveQuote: Number.isFinite(exactQuote) ? exactQuote : null, provider: "Twelve Data", symbol, timeframe, candles, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" } });
  } catch {
    return NextResponse.json({ ok: false, configured: true, candles: [], message: "Unable to reach market data provider." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
