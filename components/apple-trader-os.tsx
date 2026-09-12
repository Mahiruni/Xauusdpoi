"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./apple-trader-os.css";

type View = "Overview" | "Market" | "POI" | "Setups" | "Journal" | "Performance" | "Strategy" | "Backtest" | "Settings";
type Market = {
  live: boolean; price: number | null; change?: number | null; changePct?: number | null;
  candles?: Array<{ time: string; open: number; high: number; low: number; close: number }>;
  updatedAt: string | null; marketOpen: boolean; marketStatus?: string; message?: string; provider?: string;
};
type Fib = { direction: "BULLISH" | "BEARISH"; swingLow: number; swingHigh: number; stop: number; poi: number; tp1: number; tp2: number } | null;
type Analysis = {
  live: boolean; current: number | null; status: string; direction: "BULLISH" | "BEARISH" | null;
  reasons: string[]; fibonacci: Fib; liquidity: { swept: boolean; type: string };
  timeframes: Array<{ timeframe: string; trend: string; structure: string; confidence: number }>;
  updatedAt: string | null;
};

const EMPTY_MARKET: Market = { live: false, price: null, updatedAt: null, marketOpen: false, candles: [] };
const EMPTY_ANALYSIS: Analysis = { live: false, current: null, status: "UNKNOWN", direction: null, reasons: [], fibonacci: null, liquidity: { swept: false, type: "NONE" }, timeframes: [], updatedAt: null };

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    chart: <><path d="M3 19V5"/><path d="M3 19h18"/><path d="m6 15 4-5 3 3 5-7"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    book: <><path d="M5 4h15v16H7a2 2 0 0 0-2 2V4Z"/><path d="M5 4a2 2 0 0 1 2-2h13"/></>,
    spark: <><path d="m12 2-1.5 7.5L3 11l7.5 1.5L12 20l1.5-7.5L21 11l-7.5-1.5L12 2Z"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H5v-3h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4h3v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v3h-.2a1.7 1.7 0 0 0-1.6 1.5Z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    pulse: <path d="M3 12h4l2-7 4 14 2-7h6"/>,
    shield: <><path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.grid}</svg>;
}

function money(value: number | null | undefined) { return value == null || !Number.isFinite(value) ? "—" : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function time(value: string | null | undefined) { return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; }
function tf(a: Analysis, name: string) { return a.timeframes.find((x) => x.timeframe === name); }
function tone(status: string) { return status === "CONFIRMED" ? "green" : status === "WAIT" || status === "DEVELOPING" ? "amber" : "neutral"; }
function statusText(status: string) { return status === "CONFIRMED" ? "Confirmed" : status === "WAIT" ? "Waiting" : status === "DEVELOPING" ? "Developing" : "Unavailable"; }

function Badge({ children, kind = "neutral" }: { children: ReactNode; kind?: string }) { return <span className={`at-badge ${kind}`}>{children}</span>; }
function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`at-card ${className}`}>{children}</section>; }
function Row({ label, value, note, kind = "" }: { label: string; value: string; note?: string; kind?: string }) { return <div className="at-row"><div><b>{label}</b>{note && <small>{note}</small>}</div><strong className={kind}>{value}</strong></div>; }

function Sparkline({ candles }: { candles: Market["candles"] }) {
  const points = useMemo(() => {
    const data = (candles ?? []).slice(-36);
    if (data.length < 2) return "";
    const lo = Math.min(...data.map((x) => x.close)); const hi = Math.max(...data.map((x) => x.close)); const span = hi - lo || 1;
    return data.map((x, i) => `${(i / (data.length - 1)) * 100},${88 - ((x.close - lo) / span) * 70}`).join(" ");
  }, [candles]);
  return <div className="at-spark"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="atFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".20"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>{points && <><polyline points={`0,100 ${points} 100,100`} fill="url(#atFill)" stroke="none"/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke"/></>}</svg></div>;
}

export default function AppleTraderOS() {
  const [view, setView] = useState<View>("Overview");
  const [market, setMarket] = useState<Market>(EMPTY_MARKET);
  const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try { const r = await fetch("/api/market", { cache: "no-store" }); const d = await r.json(); if (alive) setMarket(d); } catch { if (alive) setMarket((m) => ({ ...m, live: false })); }
      try { const r = await fetch("/api/analysis", { cache: "no-store" }); const d = await r.json(); if (alive) setAnalysis(d); } catch { if (alive) setAnalysis((a) => ({ ...a, live: false })); }
    };
    void refresh(); const id = window.setInterval(refresh, 5000); return () => { alive = false; window.clearInterval(id); };
  }, []);

  const fib = analysis.fibonacci;
  const live = market.live && market.price != null;
  const currentView = view === "Overview" ? "Overview" : view;
  const nav = [
    ["Overview", "grid"], ["Market", "chart"], ["POI", "target"], ["Setups", "layers"], ["Journal", "book"],
  ] as const;

  return <div className="at-shell">
    <aside className="at-sidebar">
      <div className="at-brand"><div className="at-mark">POI</div><div><b>Trader OS</b><span>XAU / USD</span></div></div>
      <nav>{nav.map(([id, icon]) => <button key={id} className={currentView === id ? "active" : ""} onClick={() => setView(id)}><Icon name={icon}/><span>{id}</span>{id === "POI" && analysis.status === "CONFIRMED" && <i/>}</button>)}</nav>
      <div className="at-nav-label">WORKSPACE</div>
      {(["Performance", "Strategy", "Backtest", "Settings"] as View[]).map((id) => <button key={id} className={`at-subnav ${currentView === id ? "active" : ""}`} onClick={() => setView(id)}><Icon name={id === "Settings" ? "gear" : id === "Strategy" ? "spark" : "chart"}/><span>{id}</span></button>)}
      <div className="at-sidebar-bottom"><div className="at-data-card"><div><span className={live ? "at-live-dot" : "at-warn-dot"}/><b>{live ? "Live data" : "Data unavailable"}</b></div><small>{market.provider ?? "Twelve Data"}</small><small>Updated {time(market.updatedAt)}</small></div></div>
    </aside>

    <main className="at-main">
      <header className="at-topbar"><div className="at-mobile-brand"><div className="at-mark">POI</div><b>Trader OS</b></div><div className="at-breadcrumb"><span>Workspace</span><b>/</b><strong>{view}</strong></div><div className="at-top-actions"><Badge kind={live ? "green" : "amber"}><i className={live ? "at-live-dot" : "at-warn-dot"}/>{live ? "LIVE" : "UNAVAILABLE"}</Badge><span className="at-updated">{time(market.updatedAt)}</span><button className="at-icon-btn"><Icon name="menu"/></button></div></header>

      <div className="at-content">
        {view === "Overview" && <>
          <div className="at-page-head"><div><span>TRADER OS</span><h1>Good session.</h1><p>One workspace for the setup. Every price below is sourced from the live provider.</p></div><div className="at-head-actions"><Badge kind="blue">M15 EXECUTION</Badge><button onClick={() => setView("POI")} className="at-primary">Open POI <Icon name="arrow" size={15}/></button></div></div>
          <div className="at-hero-grid">
            <Card className="at-price-hero"><div className="at-card-top"><div><Badge kind={market.marketOpen && live ? "green" : "amber"}>{market.marketOpen && live ? "LIVE XAU/USD" : "LATEST PROVIDER QUOTE"}</Badge><span className="at-source">Twelve Data · /price</span></div><span className="at-market-status">{market.marketOpen ? "Market open" : "Market closed"}</span></div><div className="at-price"><strong>{money(market.price)}</strong><span>USD / oz</span></div><div className={`at-change ${(market.changePct ?? 0) >= 0 ? "up" : "down"}`}>{market.changePct == null ? "—" : `${(market.changePct >= 0 ? "+" : "")}${market.changePct.toFixed(2)}%`} <span>since previous 1m candle</span></div><Sparkline candles={market.candles}/><div className="at-price-footer"><span>Exact quote</span><b>{time(market.updatedAt)}</b><span className="at-separator">•</span><span>{market.marketStatus ?? "Provider status unknown"}</span></div></Card>
            <Card className={`at-decision ${tone(analysis.status)}`}><div className="at-card-top"><span className="at-overline">DECISION ENGINE</span><Badge kind={tone(analysis.status)}>{statusText(analysis.status)}</Badge></div><div className="at-decision-icon"><Icon name="target" size={25}/></div><h2>{analysis.status === "CONFIRMED" ? "Setup confirmed" : analysis.status === "WAIT" ? "Wait for liquidity" : analysis.status === "DEVELOPING" ? "Setup developing" : "Awaiting verified data"}</h2><p>{analysis.reasons[analysis.reasons.length - 1] || market.message || "No market condition has been verified."}</p><button onClick={() => setView("POI")} className="at-secondary">View decision path <Icon name="arrow" size={14}/></button></Card>
          </div>

          <div className="at-kpis"><Card><span>WEEKLY</span><b className={tf(analysis,"W1")?.trend === "BEARISH" ? "down" : ""}>{tf(analysis,"W1")?.trend ?? "UNKNOWN"}</b><small>Macro bias</small></Card><Card><span>DAILY</span><b className={tf(analysis,"D1")?.trend === "BEARISH" ? "down" : ""}>{tf(analysis,"D1")?.trend ?? "UNKNOWN"}</b><small>Macro bias</small></Card><Card><span>H1</span><b>{tf(analysis,"H1")?.structure ?? "UNKNOWN"}</b><small>External structure</small></Card><Card><span>LIQUIDITY</span><b className={analysis.liquidity.swept ? "up" : "wait"}>{analysis.liquidity.swept ? "SWEPT" : "WAITING"}</b><small>Internal M15</small></Card></div>

          <div className="at-section-head"><div><span>EXECUTION MAP</span><h2>Mechanical levels</h2></div><button onClick={() => setView("POI")}>Full radar <Icon name="arrow" size={14}/></button></div>
          <Card className="at-level-card"><div className="at-level-header"><span>FIBONACCI REFERENCE</span><Badge kind="blue">0.71 PRIMARY POI</Badge></div><div className="at-levels"><Row label="Stop loss" note="0.95" value={money(fib?.stop)} kind="red"/><Row label="Primary POI" note="0.71" value={money(fib?.poi)} kind="blue"/><Row label="Take profit 1" note="0.00" value={money(fib?.tp1)} kind="green"/><Row label="Take profit 2" note="−0.21" value={money(fib?.tp2)} kind="green"/></div><div className="at-level-foot"><span>Impulse {fib ? `${money(fib.swingLow)} → ${money(fib.swingHigh)}` : "not verified"}</span><span>{analysis.direction ?? "UNKNOWN"}</span></div></Card>
        </>}

        {view === "Market" && <div className="at-page-head"><div><span>MARKET</span><h1>XAU / USD</h1><p>Provider quote, multi-timeframe context and execution state.</p></div><Badge kind={live ? "green" : "amber"}>{live ? "LIVE FEED" : "UNAVAILABLE"}</Badge></div>}
        {view === "Market" && <div className="at-two-col"><Card className="at-market-big"><span>EXACT PROVIDER QUOTE</span><strong>{money(market.price)}</strong><p>{market.provider ?? "Twelve Data"} · {time(market.updatedAt)}</p><Sparkline candles={market.candles}/><div className="at-info-strip"><b>{market.marketOpen ? "OPEN" : "CLOSED"}</b><span>{market.marketStatus ?? "Provider status unavailable"}</span></div></Card><Card><div className="at-section-head inner"><div><span>CONTEXT</span><h2>Timeframes</h2></div></div>{["W1","D1","H4","H1","M15","M5"].map((name) => { const x=tf(analysis,name); return <Row key={name} label={name} value={x?.structure ?? x?.trend ?? "UNKNOWN"} note={x?.trend ?? ""} kind={x?.trend === "BEARISH" ? "red" : x?.trend === "BULLISH" ? "green" : ""}/>; })}</Card></div>}

        {view === "POI" && <><div className="at-page-head"><div><span>EXECUTION RADAR</span><h1>One setup. One decision.</h1><p>External structure first. Internal liquidity sweep before entry.</p></div><Badge kind={tone(analysis.status)}>{statusText(analysis.status)}</Badge></div><div className="at-two-col"><Card className="at-radar"><div className="at-radar-orbit"><div><span>0.71</span><small>PRIMARY POI</small></div></div><Badge kind={analysis.direction === "BEARISH" ? "red" : "green"}>{analysis.direction ?? "UNKNOWN"}</Badge><strong>{money(fib?.poi)}</strong><p>Price reference for the current valid impulse.</p><div className="at-sweep"><span className={analysis.liquidity.swept ? "at-live-dot" : "at-warn-dot"}/><div><b>{analysis.liquidity.swept ? "Liquidity swept" : "Waiting for liquidity"}</b><small>{analysis.liquidity.swept ? analysis.liquidity.type : "Required before entry"}</small></div></div></Card><Card><div className="at-section-head inner"><div><span>SEQUENCE</span><h2>Execution checklist</h2></div></div>{["HTF bias","Key level","Structure shift","Valid swing","Fibonacci","0.71 POI","Liquidity sweep","Entry"].map((x,i) => { const done = i < 5 && !!fib; const current = i === 6 && !analysis.liquidity.swept; return <div className={`at-check ${done ? "done" : current ? "current" : ""}`} key={x}><span>{done ? "✓" : current ? "•" : i + 1}</span><div><b>{x}</b><small>{done ? "Verified" : current ? "Required next" : "Locked"}</small></div></div>; })}</Card></div><Card className="at-level-card"><div className="at-level-header"><span>RISK MAP</span><span>NO ENTRY UNTIL SWEEP</span></div><Row label="Stop" note="0.95" value={money(fib?.stop)} kind="red"/><Row label="POI" note="0.71" value={money(fib?.poi)} kind="blue"/><Row label="TP1" note="0.00" value={money(fib?.tp1)} kind="green"/><Row label="TP2" note="−0.21" value={money(fib?.tp2)} kind="green"/></Card></>}

        {view === "Setups" && <><div className="at-page-head"><div><span>SETUPS</span><h1>Setup queue</h1><p>Only conditions verified by the strategy engine appear here.</p></div><Badge kind={tone(analysis.status)}>{statusText(analysis.status)}</Badge></div><Card className="at-setup-card"><Badge kind={tone(analysis.status)}>{statusText(analysis.status)}</Badge><h2>XAU/USD · {analysis.direction ?? "UNKNOWN"}</h2><p>{analysis.reasons.join(" ") || "Waiting for verified market context."}</p><button className="at-primary" onClick={() => setView("POI")}>Inspect setup <Icon name="arrow" size={14}/></button></Card></>}

        {view === "Journal" && <><div className="at-page-head"><div><span>JOURNAL</span><h1>Execution journal</h1><p>Capture why you entered, what you risked and what the market did.</p></div></div><Card className="at-empty"><div className="at-empty-icon">＋</div><h2>No trades yet</h2><p>No history is fabricated. Journal entries will appear here once recorded.</p><button className="at-primary">New entry</button></Card></>}

        {(["Performance","Strategy","Backtest","Settings"] as View[]).includes(view) && <><div className="at-page-head"><div><span>WORKSPACE</span><h1>{view}</h1><p>{view === "Strategy" ? "The canonical POI execution model." : view === "Backtest" ? "Test the exact rules against historical candles." : view === "Performance" ? "Measure process quality, not just P&L." : "Control market data, notifications and appearance."}</p></div></div><Card className="at-feature"><Badge kind="blue">SYSTEM</Badge><h2>{view === "Strategy" ? "HTF → Shift → Swing → 0.71 → Sweep → Entry" : view === "Backtest" ? "No synthetic results" : view === "Performance" ? "Journal-driven analytics" : "Provider-first configuration"}</h2><p>{view === "Strategy" ? "Weekly and Daily bias must align. H4/H1 structure must support the direction. A valid impulse is required before Fibonacci. Price returns to 0.71, then internal liquidity must be swept before entry." : view === "Backtest" ? "Backtesting will use the same deterministic strategy engine and provider candle schema. No performance numbers are invented." : view === "Performance" ? "Expectancy, drawdown, win rate and rule adherence should be calculated from actual journal records." : "The market surface shows an explicit unavailable state whenever the configured provider cannot return a quote."}</p></Card></>}
      </div>
      <div className="at-mobile-tabs">{nav.slice(0,5).map(([id,icon]) => <button key={id} className={currentView === id ? "active" : ""} onClick={() => setView(id)}><Icon name={icon} size={17}/><span>{id === "Overview" ? "Home" : id}</span></button>)}</div>
    </main>
  </div>;
}
