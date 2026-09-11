"use client";

import { useEffect, useMemo, useState } from "react";
import { STRATEGY } from "@/lib/strategy";

type MarketPayload = {
  live: boolean;
  configured: boolean;
  symbol: string;
  provider: string;
  message?: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  updatedAt: string | null;
  interval?: string;
};

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSigned(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatUpdated(value: string | null) {
  if (!value) return "Awaiting feed";
  const parsed = new Date(value.replace(" ", "T") + (value.includes("T") ? "" : "Z"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function RightDock() {
  const [market, setMarket] = useState<MarketPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/market", { cache: "no-store" });
        const payload = (await response.json()) as MarketPayload;
        if (active) setMarket(payload);
      } catch {
        if (active) {
          setMarket({
            live: false,
            configured: false,
            symbol: "XAU/USD",
            provider: "Twelve Data",
            message: "Market endpoint is temporarily unavailable.",
            price: null,
            change: null,
            changePct: null,
            updatedAt: null,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const movementTone = useMemo(() => {
    if (!market?.live || market.change === null) return "neutral";
    if (market.change > 0) return "positive";
    if (market.change < 0) return "negative";
    return "neutral";
  }, [market]);

  const feedLabel = loading
    ? "CONNECTING"
    : market?.live
      ? "LIVE"
      : market?.configured
        ? "PROVIDER ERROR"
        : "KEY REQUIRED";

  return (
    <aside className="rightDock" aria-label="Market intelligence dock">
      <div className="dockTopline">
        <div>
          <span className="dockKicker">MARKET DOCK</span>
          <strong>Gold intelligence</strong>
        </div>
        <span className={`feedState ${market?.live ? "live" : ""}`}>
          <span className="feedPulse" /> {feedLabel}
        </span>
      </div>

      <section className="dockQuote">
        <div className="dockQuoteHead">
          <div>
            <span className="dockSymbol">XAU / USD</span>
            <span className="dockProvider">{market?.provider ?? "Twelve Data"}</span>
          </div>
          <span className="dockInterval">{market?.interval ?? "1m"}</span>
        </div>
        <div className="dockPrice">{formatPrice(market?.price ?? null)}</div>
        <div className={`dockMove ${movementTone}`}>
          <span>{formatSigned(market?.change ?? null)}</span>
          <span>{market?.changePct === null || market?.changePct === undefined ? "—" : `${formatSigned(market.changePct)}%`}</span>
        </div>
        <div className="dockFreshness">
          <span>Last update</span>
          <strong>{formatUpdated(market?.updatedAt ?? null)}</strong>
        </div>
      </section>

      <section className="dockSection">
        <div className="dockSectionHead">
          <span>Canonical rules</span>
          <span className="dockLock">LOCKED</span>
        </div>
        <div className="dockRuleGrid">
          <div><span>POI</span><strong>{STRATEGY.poi.toFixed(2)}</strong></div>
          <div><span>SL</span><strong>{STRATEGY.stop.toFixed(2)}</strong></div>
          <div><span>TP1</span><strong>{STRATEGY.tp1.toFixed(2)}</strong></div>
          <div><span>TP2</span><strong>{STRATEGY.tp2.toFixed(2)}</strong></div>
        </div>
      </section>

      <section className="dockSection">
        <div className="dockSectionHead">
          <span>System readiness</span>
          <span className="dockMeta">PRODUCTION</span>
        </div>
        <div className="dockStatusList">
          <div className="dockStatusRow"><span className={`statusOrb ${market?.live ? "ok" : "warn"}`} /><span>Realtime price feed</span><strong>{market?.live ? "Connected" : "Pending"}</strong></div>
          <div className="dockStatusRow"><span className="statusOrb ok" /><span>POI rule engine</span><strong>Loaded</strong></div>
          <div className="dockStatusRow"><span className="statusOrb ok" /><span>Vercel deployment</span><strong>Ready</strong></div>
          <div className="dockStatusRow"><span className="statusOrb warn" /><span>Structure automation</span><strong>Next</strong></div>
        </div>
      </section>

      <section className="dockSection dockMessage">
        <div className="dockSectionHead"><span>Feed note</span></div>
        <p>{market?.message ?? (market?.live ? "Verified server-side XAU/USD data is active. Strategy-state automation remains separate from quote delivery." : "Add TWELVE_DATA_API_KEY in Vercel to activate live XAU/USD pricing.")}</p>
      </section>

      <div className="dockFooter">
        <span>POI Trader OS</span>
        <strong>Precision over prediction.</strong>
      </div>
    </aside>
  );
}
