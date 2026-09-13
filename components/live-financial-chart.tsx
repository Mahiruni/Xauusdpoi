"use client";

import { useEffect, useState } from "react";

type Props = { symbol?: string; timeframe?: string; height?: number };

export default function LiveFinancialChart({ symbol = "XAU/USD", timeframe = "15m", height = 560 }: Props) {
  const [heightPx, setHeightPx] = useState(height);

  useEffect(() => {
    setHeightPx(height);
  }, [height]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#080a0f] text-white">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-xs font-semibold">{symbol}</div>
          <div className="text-[10px] uppercase tracking-[.18em] text-slate-500">{timeframe} · market chart</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold tracking-tight">—</div>
          <div className="text-[10px] uppercase tracking-[.14em] text-slate-500">DATA SOURCE DISCONNECTED</div>
        </div>
      </div>
      <div style={{ height: heightPx }} className="grid place-items-center px-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.5 4.5H21v10.5" />
              <path d="M3 19l6-6 4 4 3-3" />
            </svg>
          </div>
          <div className="text-sm font-medium text-white">Live market data is disconnected</div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            The previous market-data integration has been completely removed. No synthetic price or fake candles are shown.
          </div>
        </div>
      </div>
    </div>
  );
}
