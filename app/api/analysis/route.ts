import { analyzeTimeframe, calculateFib, detectLiquiditySweep, type Candle } from "@/lib/market-analysis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const SYMBOL = "XAU/USD";

type TimeframeResult = {
  timeframe: string;
  trend: string;
  structure: string;
  confidence: number;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" },
  });
}

export async function GET() {
  const timeframes: TimeframeResult[] = [];

  return json({
    live: false,
    configured: false,
    symbol: SYMBOL,
    provider: null,
    current: null,
    status: "UNKNOWN",
    direction: null,
    reasons: [
      "No external market-data provider is connected.",
      "Weekly/Daily bias cannot be verified without current market candles.",
      "H4/H1 structure shift cannot be verified without current market candles.",
      "A valid Fibonacci impulse and internal liquidity sweep cannot be verified without current market candles.",
    ],
    fibonacci: null,
    liquidity: { swept: false, type: "NONE" },
    timeframes,
    execution: { m15: null, m5: null },
    updatedAt: null,
    quoteSource: null,
    rules: { poi: 0.71, stop: 0.95, tp1: 0, tp2: -0.21 },
  });
}
