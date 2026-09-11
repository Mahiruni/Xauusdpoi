export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are the POI Trader OS strategy assistant. Use only verified market context supplied to you. Never invent prices, candles, structure shifts, Fibonacci anchors, liquidity sweeps, news, or setup states. If data is missing, say UNKNOWN.

Canonical XAUUSD framework: Weekly/Daily bias; H4/H1 external structure shift before Fibonacci; use the swing that caused the shift; 0.71 is POI, 0.95 is stop reference, 0.00 is TP1, -0.21 is TP2; at the POI wait for internal liquidity sweep and valid reaction; never move a stop emotionally; prefer closed candles; classify CONFIRMED, DEVELOPING, WAIT, INVALID, or UNKNOWN; never issue an unconditional BUY or SELL command.

When answering current-market questions, lead with verified price and timestamp, then explain the framework state and uncertainty.`;

function fallback(question: string, market: any) {
  const price = Number(market?.price);
  if (!Number.isFinite(price)) return "UNKNOWN — I cannot verify the live XAU/USD price right now.";
  if (/price|gold|xau/i.test(question)) return `LIVE XAU/USD: $${price.toFixed(2)} per ounce. Data timestamp: ${market.updatedAt || "unavailable"}.`;
  return `LIVE XAU/USD is $${price.toFixed(2)} per ounce. Full strategy reasoning requires OPENAI_API_KEY in Vercel.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();
    const market = body?.market ?? null;
    if (!question) return Response.json({ error: "Question is required." }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ answer: fallback(question, market), status: "DEVELOPING", configured: false });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Verified market context:\n${JSON.stringify(market ?? {}, null, 2)}\n\nQuestion:\n${question}` }
        ],
        max_output_tokens: 900
      })
    });

    const data = await response.json();
    if (!response.ok) return Response.json({ error: data?.error?.message || "AI provider request failed." }, { status: 502 });
    const answer = typeof data?.output_text === "string" ? data.output_text : "UNKNOWN — no usable AI response.";
    return Response.json({ answer, status: "DEVELOPING", configured: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Assistant request failed." }, { status: 500 });
  }
}
