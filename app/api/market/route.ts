export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const SYMBOL = "XAU/USD";

function noStore(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" },
  });
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
  return noStore({
    live: false,
    configured: false,
    symbol: SYMBOL,
    provider: null,
    price: null,
    change: null,
    changePct: null,
    candles: [],
    updatedAt: null,
    marketOpen: isGoldSessionOpen(),
    marketStatus: isGoldSessionOpen() ? "OPEN" : "CLOSED",
    message: "No external market-data provider is connected. Connect a broker or market-data source to enable live XAU/USD data.",
  });
}
