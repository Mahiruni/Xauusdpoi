export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type TwelvePrice = {
  price?: string;
  status?: string;
  message?: string;
};

type TwelveSeries = {
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
  }>;
  status?: string;
  message?: string;
};

const SYMBOL = "XAU/USD";

function noStore(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY;

  if (!apiKey) {
    return noStore({
      live: false,
      configured: false,
      symbol: SYMBOL,
      provider: "Twelve Data",
      message: "Live market provider is ready. Add TWELVE_DATA_API_KEY in Vercel to activate XAU/USD data.",
      price: null,
      change: null,
      changePct: null,
      candles: [],
      updatedAt: null,
    });
  }

  try {
    const priceUrl = new URL("https://api.twelvedata.com/price");
    priceUrl.searchParams.set("symbol", SYMBOL);
    priceUrl.searchParams.set("apikey", apiKey);

    const seriesUrl = new URL("https://api.twelvedata.com/time_series");
    seriesUrl.searchParams.set("symbol", SYMBOL);
    seriesUrl.searchParams.set("interval", "1min");
    seriesUrl.searchParams.set("outputsize", "80");
    seriesUrl.searchParams.set("format", "JSON");
    seriesUrl.searchParams.set("apikey", apiKey);

    const [priceResponse, seriesResponse] = await Promise.all([
      fetch(priceUrl, { cache: "no-store" }),
      fetch(seriesUrl, { cache: "no-store" }),
    ]);

    const priceData = (await priceResponse.json()) as TwelvePrice;
    const seriesData = (await seriesResponse.json()) as TwelveSeries;

    if (!priceResponse.ok || !seriesResponse.ok || !priceData.price || !Array.isArray(seriesData.values)) {
      return noStore({
        live: false,
        configured: true,
        symbol: SYMBOL,
        provider: "Twelve Data",
        message: priceData.message || seriesData.message || "The live provider returned an incomplete response.",
        price: null,
        change: null,
        changePct: null,
        candles: [],
        updatedAt: null,
      }, 502);
    }

    const price = Number(priceData.price);
    const candles = [...seriesData.values]
      .reverse()
      .map((candle) => ({
        time: candle.datetime,
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
      }))
      .filter((candle) => [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite));

    const firstClose = candles[0]?.close ?? price;
    const lastCandle = candles[candles.length - 1];
    const change = price - firstClose;
    const changePct = firstClose ? (change / firstClose) * 100 : 0;

    return noStore({
      live: Number.isFinite(price) && candles.length > 0,
      configured: true,
      symbol: SYMBOL,
      provider: "Twelve Data",
      price,
      change,
      changePct,
      candles,
      updatedAt: lastCandle?.time ?? new Date().toISOString(),
      interval: "1min",
    });
  } catch (error) {
    return noStore({
      live: false,
      configured: true,
      symbol: SYMBOL,
      provider: "Twelve Data",
      message: error instanceof Error ? error.message : "Unknown market-data error",
      price: null,
      change: null,
      changePct: null,
      candles: [],
      updatedAt: null,
    }, 502);
  }
}
