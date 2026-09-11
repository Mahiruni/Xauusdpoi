"use client";

import { useEffect, useState } from "react";

type Market = { live?: boolean; price?: number | null; changePct?: number | null; updatedAt?: string | null; message?: string };

export default function LiveGoldPrice() {
  const [market, setMarket] = useState<Market>({});

  async function refresh() {
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      setMarket(await res.json());
    } catch {
      setMarket({ live: false });
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 15000);
    return () => window.clearInterval(id);
  }, []);

  const price = Number(market.price);
  const live = market.live && Number.isFinite(price);
  const pct = Number(market.changePct);

  return (
    <div className={`liveGold ${live ? "isLive" : "isWaiting"}`} title={market.updatedAt ? `Feed timestamp: ${market.updatedAt}` : market.message}>
      <span className="liveGoldDot" />
      <span className="liveGoldLabel">XAU/USD</span>
      <strong>{live ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}</strong>
      {live && Number.isFinite(pct) ? <span className={pct >= 0 ? "liveGoldUp" : "liveGoldDown"}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</span> : null}
      <style jsx>{`
        .liveGold{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 13px;border:1px solid rgba(49,87,213,.18);border-radius:13px;background:rgba(255,255,255,.68);backdrop-filter:blur(18px);box-shadow:0 10px 30px rgba(31,45,72,.08);white-space:nowrap;font-size:12px;color:#24304a}
        .liveGoldDot{width:7px;height:7px;border-radius:50%;background:#a8b0be;box-shadow:0 0 0 4px rgba(168,176,190,.12)}
        .isLive .liveGoldDot{background:#20a66a;box-shadow:0 0 0 4px rgba(32,166,106,.10)}
        .liveGoldLabel{font-size:9px;font-weight:800;letter-spacing:.12em;color:#69738a}
        .liveGold strong{font-size:15px;letter-spacing:-.02em;color:#18223a}
        .liveGoldUp{color:#16834f;font-size:10px;font-weight:800}.liveGoldDown{color:#c24f4f;font-size:10px;font-weight:800}
      `}</style>
    </div>
  );
}
