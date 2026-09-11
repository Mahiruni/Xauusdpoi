"use client";

import FinancialChart, { mockCandles } from "@/components/financial-chart";

export default function ChartPage() {
  return (
    <main className="min-h-screen bg-[#080a0f] p-3 text-white md:p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">POI Trader OS · Chart Lab</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Institutional market chart</h1>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-slate-400">Lightweight Charts · 10k cap</span>
        </div>
        <FinancialChart symbol="XAU/USD" initialTimeframe="15m" initialData={mockCandles(1800)} height={760} />
      </div>
    </main>
  );
}
