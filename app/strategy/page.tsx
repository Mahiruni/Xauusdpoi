import Link from "next/link";

const layers = [
  {
    tf: "W1",
    role: "Macro Bias",
    rule: "Determine the dominant weekly direction from confirmed swing structure. Mark major external liquidity and the weekly dealing range.",
    confirms: ["Higher highs / higher lows = bullish bias", "Lower highs / lower lows = bearish bias", "Mark weekly external liquidity before looking for entries"],
  },
  {
    tf: "H4",
    role: "Refinement + Location",
    rule: "Refine the weekly idea into the active H4 structure. Require a meaningful displacement, BOS/CHOCH and a valid swing before drawing Fibonacci.",
    confirms: ["H4 structure agrees with W1 bias", "Identify the current impulse and valid swing anchors", "Locate premium/discount, FVG/OB and liquidity pools"],
  },
  {
    tf: "M15",
    role: "Execution Structure",
    rule: "M15 is the primary execution timeframe. Wait for price to reach the valid 0.71 POI and confirm internal liquidity behavior.",
    confirms: ["Closed-candle structure shift only", "0.71 POI must come from the current valid impulse", "Liquidity sweep inside/at the POI is required before entry"],
  },
  {
    tf: "M5",
    role: "Entry Refinement",
    rule: "M5 is optional but can refine the entry after the M15 setup is already valid. It must not override W1/H4/M15 direction.",
    confirms: ["M5 sweep/rejection or micro BOS", "Entry trigger occurs after the M15 POI condition", "If M5 disagrees with M15, stand aside rather than force an entry"],
  },
];

const sequence = [
  "W1 bias",
  "H4 structure",
  "M15 structure shift",
  "Valid impulse",
  "0.71 POI",
  "Liquidity sweep",
  "M5 refinement",
  "Entry trigger",
  "0.95 invalidation",
  "TP1 0.00 / TP2 −0.21",
];

export default function StrategyPage() {
  return (
    <main className="min-h-screen bg-[#08090c] px-4 py-6 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="text-[10px] font-extrabold tracking-[0.18em] text-[#d8a84e]">POI TRADER OS · STRATEGY</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Bias → Structure → POI → Entry</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">A strict top-down model: Weekly establishes the macro bias, H4 refines location and structure, M15 controls execution, and M5 refines the final entry without overriding the higher-timeframe thesis.</p>
          </div>
          <Link href="/" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/[0.08]">← Back to Trader OS</Link>
        </div>

        <section className="mb-8 rounded-2xl border border-[#d8a84e]/20 bg-[#d8a84e]/[0.05] p-5 sm:p-6">
          <div className="text-[9px] font-extrabold tracking-[0.16em] text-[#d8a84e]">NON-NEGOTIABLE HIERARCHY</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {["W1 = Bias", "H4 = Structure + Location", "M15 = Execution", "M5 = Entry Refinement"].map((x) => (
              <div key={x} className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm font-semibold">{x}</div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          {layers.map((layer, index) => (
            <section key={layer.tf} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold tracking-[-0.04em] text-[#d8a84e]">{layer.tf}</div>
                  <h2 className="mt-1 text-lg font-semibold">{layer.role}</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-bold tracking-[0.1em] text-white/45">STEP {index + 1}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/60">{layer.rule}</p>
              <div className="mt-4 space-y-2">
                {layer.confirms.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs text-white/70">
                    <span className="mt-0.5 text-[#d8a84e]">✓</span><span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <div className="text-[9px] font-extrabold tracking-[0.16em] text-white/40">EXECUTION SEQUENCE</div>
          <h2 className="mt-2 text-xl font-semibold">No skipped steps</h2>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {sequence.map((step, i) => (
              <div key={step} className="min-w-[130px] rounded-xl border border-white/10 bg-black/10 p-3">
                <div className="text-[9px] font-bold text-white/35">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-3 text-xs font-semibold leading-5">{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-[9px] font-extrabold tracking-[0.14em] text-[#d8a84e]">FIBONACCI MODEL</div>
            <div className="mt-4 space-y-3 text-sm"><p><b>0.71</b> — primary POI</p><p><b>0.95</b> — invalidation / SL reference</p><p><b>0.00</b> — TP1</p><p><b>−0.21</b> — TP2</p></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-[9px] font-extrabold tracking-[0.14em] text-[#d8a84e]">ENTRY RULE</div>
            <p className="mt-4 text-sm leading-6 text-white/60">Do not enter merely because price touches 0.71. The POI must remain structurally valid and the required liquidity sweep must occur. M5 may refine the trigger only after M15 has validated the setup.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-[9px] font-extrabold tracking-[0.14em] text-[#d8a84e]">INVALIDATION</div>
            <p className="mt-4 text-sm leading-6 text-white/60">Invalidate the setup when the defining swing is broken, the higher-timeframe thesis is contradicted, the 0.95 reference is violated, or the liquidity/structure sequence no longer exists. Never keep a stale POI alive.</p>
          </div>
        </section>

        <div className="mt-8 rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-5 text-xs leading-6 text-white/55">
          <b className="text-red-300">Safety gate:</b> this framework is a rules engine, not a promise of profitable trades. The system should show <b>WAIT / NO DATA</b> whenever live candles are missing or the structure cannot be verified. It should never manufacture a setup from stale or synthetic prices.
        </div>
      </div>
    </main>
  );
}
