"use client";

import { useFinancialChartStore, type ChartType } from "@/lib/financial-chart-store";
import FinancialChart, { mockCandles } from "@/components/financial-chart";

const chartTypes: Array<[ChartType, string]> = [
  ["candles", "Candles"], ["hollow", "Hollow"], ["heikin", "Heikin Ashi"], ["line", "Line"],
  ["area", "Area"], ["bar", "Bars"], ["baseline", "Baseline"],
];

export default function ChartPage() {
  const { chartType, set } = useFinancialChartStore();
  return (
    <main className="min-h-screen bg-[#080a0f] p-3 text-white md:p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">POI Trader OS · Chart Lab</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Institutional market chart</h1>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {chartTypes.map(([type, label]) => (
              <button key={type} onClick={() => set({ chartType: type })} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${chartType === type ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <FinancialChart symbol="XAU/USD" initialTimeframe="15m" initialData={mockCandles(1800)} height={760} />
      </div>
    </main>
  );
}
