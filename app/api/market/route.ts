export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type TwelvePrice = { price?: string; status?: string; message?: string };
type TwelveSeries = { values?: Array<{ datetime: string; open: string; high: string; low: string; close: string }>; status?: string; message?: string };
const SYMBOL = "XAU/USD";

function noStore(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" } });
}

function isGoldSessionOpen(now = new Date()) {
  const day = now.getUTCDay();
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (day === 6) return false;
  if (day === 0) return minutes >= 22 * 60;
  if (day === 5) return minutes < 21 * 60;
  return minutes >= 22 * 60 || minutes < 21 * 60;
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY;
  if (!apiKey) return noStore({ live: false, configured: false, symbol: SYMBOL, provider: "Twelve Data", message: "TWELVE_DATA_API_KEY is not configured in Vercel.", price: null, change: null, changePct: null, candles: [], updatedAt: null, marketOpen: false });

  try {
    const priceUrl = new URL("https://api.twelvedata.com/price");
    priceUrl.searchParams.set("symbol", SYMBOL);
    priceUrl.searchParams.set("apikey", apiKey);
    const priceResponse = await fetch(priceUrl, { cache: "no-store", headers: { Accept: "application/json" } });
    const priceData = (await priceResponse.json()) as TwelvePrice;
    const price = Number(priceData.price);
    if (!priceResponse.ok || !Number.isFinite(price)) {
      return noStore({ live: false, configured: true, symbol: SYMBOL, provider: "Twelve Data", message: priceData.message || "The live XAU/USD quote is unavailable.", price: null, change: null, changePct: null, candles: [], updatedAt: null, marketOpen: isGoldSessionOpen() }, 502);
    }

    const seriesUrl = new URL("https://api.twelvedata.com/time_series");
    seriesUrl.searchParams.set("symbol", SYMBOL);
    seriesUrl.searchParams.set("interval", "1min");
    seriesUrl.searchParams.set("outputsize", "80");
    seriesUrl.searchParams.set("format", "JSON");
    seriesUrl.searchParams.set("apikey", apiKey);
    const seriesResponse = await fetch(seriesUrl, { cache: "no-store", headers: { Accept: "application/json" } });
    const seriesData = (await seriesResponse.json()) as TwelveSeries;

    const candles = Array.isArray(seriesData.values) ? [...seriesData.values].reverse().map((candle) => ({
      time: candle.datetime,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
    })).filter((candle) => [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)) : [];

    const previous = candles.at(-2)?.close ?? candles.at(-1)?.close ?? price;
    const change = price - previous;
    const changePct = previous ? (change / previous) * 100 : 0;
    const updatedAt = new Date().toISOString();
    const marketOpen = isGoldSessionOpen();

    // The quote endpoint is authoritative. The final chart bar is adjusted to the exact quote
    // so every UI surface that consumes /api/market agrees on the same XAU/USD price.
    if (candles.length) {
      const last = candles[candles.length - 1];
      last.close = price;
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
    }

    return noStore({ live: true, configured: true, symbol: SYMBOL, provider: "Twelve Data", price, change, changePct, candles, updatedAt, quoteAt: updatedAt, marketOpen, marketStatus: marketOpen ? "OPEN" : "CLOSED — showing latest provider quote", interval: "1min" });
  } catch (error) {
    return noStore({ live: false, configured: true, symbol: SYMBOL, provider: "Twelve Data", message: error instanceof Error ? error.message : "Unknown market-data error", price: null, change: null, changePct: null, candles: [], updatedAt: null, marketOpen: isGoldSessionOpen() }, 502);
  }
}
