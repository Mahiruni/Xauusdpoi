import LiveFinancialChart from "@/components/live-financial-chart";

export default function ChartPage() {
  return (
    <main className="min-h-screen bg-[#080a0f] p-3 text-white md:p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">POI Trader OS · Chart Lab</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Live XAU/USD market chart</h1>
          <p className="mt-1 text-xs text-slate-500">The displayed price is the exact provider quote. No demo or synthetic price is used.</p>
        </div>
        <LiveFinancialChart symbol="XAU/USD" timeframe="15m" height={760} />
      </div>
    </main>
  );
}
