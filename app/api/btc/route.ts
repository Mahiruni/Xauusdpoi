export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function noStore(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" },
  });
}

export async function GET() {
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", { cache: "no-store" });
    if (!response.ok) throw new Error(`Binance returned ${response.status}`);
    const data = await response.json() as { lastPrice: string; priceChange: string; priceChangePercent: string; closeTime: number };
    const price = Number(data.lastPrice);
    const change = Number(data.priceChange);
    const changePct = Number(data.priceChangePercent);
    if (!Number.isFinite(price)) throw new Error("Invalid BTC price");

    return noStore({
      live: true,
      symbol: "BTC/USD",
      price,
      change,
      changePct,
      updatedAt: new Date(data.closeTime || Date.now()).toISOString(),
      provider: "Binance BTC/USDT",
      message: "Live BTC price from Binance. BTC trades 24/7.",
    });
  } catch (error) {
    return noStore({
      live: false,
      symbol: "BTC/USD",
      price: null,
      change: null,
      changePct: null,
      updatedAt: null,
      provider: "Binance",
      message: error instanceof Error ? error.message : "BTC market data unavailable",
    }, 503);
  }
}
