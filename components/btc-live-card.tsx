"use client";

import { useEffect, useState } from "react";

type Btc = { live: boolean; price: number | null; changePct: number | null; updatedAt: string | null; provider?: string };

function money(value: number | null) {
  return value == null ? "—" : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BtcLiveCard() {
  const [btc, setBtc] = useState<Btc>({ live: false, price: null, changePct: null, updatedAt: null });

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const r = await fetch("/api/btc", { cache: "no-store" });
        const data = await r.json();
        if (alive) setBtc(data);
      } catch {
        if (alive) setBtc((current) => ({ ...current, live: false }));
      }
    };
    void refresh();
    const id = window.setInterval(refresh, 3000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const up = (btc.changePct ?? 0) >= 0;

  return (
    <section className="border-t border-black/[0.06] bg-white px-3 py-8 text-[#17181b] sm:px-6 md:px-10">
      <div className="mx-auto max-w-[1260px]">
        <div className="rounded-[22px] border border-black/[0.07] bg-[#f8f8fa] p-5 shadow-[0_18px_50px_rgba(25,30,40,.06)] sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-extrabold tracking-[0.16em] text-[#858991]">
                <span className={`h-2 w-2 rounded-full ${btc.live ? "bg-[#16a34a]" : "bg-[#f59e0b]"}`} />
                LIVE CRYPTO MARKET
              </div>
              <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.045em]">BTC/USD</h2>
              <p className="mt-1 text-[10px] text-[#777b83]">Real-time Bitcoin reference price · 24/7 market</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[34px] font-semibold tracking-[-0.055em] tabular-nums">${money(btc.price)}</div>
              <div className={`mt-1 text-[11px] font-bold ${up ? "text-[#16803b]" : "text-[#c43d3d]"}`}>
                {btc.changePct == null ? "—" : `${up ? "+" : ""}${btc.changePct.toFixed(2)}%`} <span className="font-normal text-[#858991]">24h</span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-black/[0.06] pt-4 text-[9px] text-[#777b83]">
            <span><b className="text-[#17181b]">Source:</b> {btc.provider ?? "Binance"}</span>
            <span><b className="text-[#17181b]">Updated:</b> {btc.updatedAt ? new Date(btc.updatedAt).toLocaleTimeString() : "—"}</span>
            <span className="font-semibold text-[#16803b]">BTC trades 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}
