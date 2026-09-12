import IphoneTraderOS from "@/components/iphone-trader-os";
import RightDock from "@/components/right-dock";
import LiveGoldPrice from "@/components/live-gold-price";
import AIAssistantOverlay from "@/components/ai-assistant-overlay";
import LiveFinancialChart from "@/components/live-financial-chart";

export default function Page() {
  return (
    <>
      <IphoneTraderOS />
      <RightDock />
      <div style={{ position: "fixed", top: 20, right: 190, zIndex: 60 }}>
        <LiveGoldPrice />
      </div>
      <AIAssistantOverlay />
      <section className="border-t border-white/10 bg-[#080a0f] px-3 py-6 text-white md:px-6 md:py-10">
        <div className="mx-auto max-w-[1800px]">
          <div className="mb-4 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">POI Trader OS · Live Market</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">XAU/USD Market Chart</h2>
            </div>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-slate-400 md:inline-flex">Exact provider quote · refreshed every 5 seconds · no synthetic candles</span>
          </div>
          <LiveFinancialChart symbol="XAU/USD" timeframe="15m" height={760} />
        </div>
      </section>
    </>
  );
}
