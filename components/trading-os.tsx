"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEMO_SETUP, SETUP_STAGES, STRATEGY, fibPrice, fmt, setupReason, setupState } from "@/lib/strategy";

type Tab = "Overview" | "Live Market" | "POI Monitor" | "Setups" | "Journal" | "Backtest" | "Strategy Lab" | "Analytics" | "Psychology" | "Economic Calendar" | "AI Assistant" | "Settings";

const tabs: { label: Tab; icon: string; group: string }[] = [
  { label: "Overview", icon: "grid", group: "Workspace" },
  { label: "Live Market", icon: "pulse", group: "Workspace" },
  { label: "POI Monitor", icon: "target", group: "Workspace" },
  { label: "Setups", icon: "layers", group: "Workspace" },
  { label: "Journal", icon: "book", group: "Performance" },
  { label: "Backtest", icon: "rotate", group: "Performance" },
  { label: "Strategy Lab", icon: "flask", group: "Research" },
  { label: "Analytics", icon: "chart", group: "Research" },
  { label: "Psychology", icon: "brain", group: "Performance" },
  { label: "Economic Calendar", icon: "calendar", group: "Research" },
  { label: "AI Assistant", icon: "spark", group: "Tools" },
  { label: "Settings", icon: "gear", group: "Tools" },
];

const stages = SETUP_STAGES;

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    pulse: <><path d="M3 12h4l2-7 4 14 2-7h6"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 5.5V19a3 3 0 0 1 3-3h13"/></>,
    rotate: <><path d="M20 11a8 8 0 1 0 1 4"/><path d="M20 4v7h-7"/></>,
    flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 3 5-7"/></>,
    brain: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3"/><path d="M9 4v16M15 4v16M9 8h3M12 12h3M9 16h3"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/></>,
    spark: <><path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4L12 3Z"/><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6L19 16Z"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8.1 15a1.7 1.7 0 0 0-1.6-1H6v-2.5h.5a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.5V14h-.5a1.7 1.7 0 0 0-1.6 1Z"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg {...common}>{paths[name] ?? paths.grid}</svg>;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "coral" | "green" | "amber" }) {
  return <span className={`os-badge os-${tone}`}>{children}</span>;
}

function Stat({ label, value, meta, tone = "" }: { label: string; value: string; meta: string; tone?: string }) {
  return <motion.div whileHover={{ y: -2 }} className="os-stat"><span>{label}</span><strong className={tone}>{value}</strong><small>{meta}</small></motion.div>;
}

function SetupState() {
  const state = setupState();
  const current = DEMO_SETUP.stateIndex;
  const score = state === "VALID" ? 91 : state === "DEVELOPING" ? 72 : state === "WAIT" ? 44 : 18;
  return <section className="setup-hero">
    <div className="setup-hero-main">
      <div className="setup-kicker"><span className="live-dot"/> SYSTEM EVALUATION <Badge tone="amber">DEMO</Badge></div>
      <div className="setup-heading"><div><h1>Setup state</h1><p>One decision at a time. The system only advances when its conditions are objectively satisfied.</p></div><div className="setup-score"><div className="score-ring" style={{"--score": `${score * 3.6}deg`} as React.CSSProperties}><div><strong>{score}</strong><span>/100</span></div></div><small>System confidence</small></div></div>
      <div className="state-callout"><div className={`state-icon ${state.toLowerCase()}`}><Icon name={state === "DEVELOPING" ? "target" : state === "VALID" ? "shield" : "pulse"} size={21}/></div><div><Badge tone={state === "VALID" ? "green" : "amber"}>{state}</Badge><h2>{state === "DEVELOPING" ? "Waiting for internal liquidity" : state === "VALID" ? "All entry conditions aligned" : "Conditions are not complete"}</h2><p>{setupReason()}</p></div></div>
    </div>
    <div className="setup-rail">
      <div className="rail-head"><span>SETUP PROGRESSION</span><strong>{current + 1} / {stages.length}</strong></div>
      <div className="rail-track">{stages.map((stage, i) => <div key={stage} className={`rail-step ${i < current ? "done" : i === current ? "active" : ""}`}><span>{i < current ? "✓" : String(i + 1).padStart(2, "0")}</span><div><b>{stage}</b>{i === current && <small>Current condition</small>}</div></div>)}</div>
    </div>
  </section>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="os-page-head"><div><span className="os-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`os-panel ${className}`}>{children}</section>; }
function PanelTitle({ title, meta, action }: { title: string; meta?: string; action?: React.ReactNode }) { return <div className="os-panel-title"><div><h3>{title}</h3>{meta && <span>{meta}</span>}</div>{action}</div>; }

function Overview() {
  return <div className="os-content"><SetupState/><div className="os-grid os-grid-4"><Stat label="WEEKLY BIAS" value="BEARISH" meta="Higher timeframe" tone="coral"/><Stat label="DAILY BIAS" value="BEARISH" meta="Aligned with weekly" tone="coral"/><Stat label="H1 STRUCTURE" value="SHIFT" meta="External shift" tone="green"/><Stat label="POI" value={fmt(fibPrice(STRATEGY.poi))} meta="0.71 primary zone" tone="amber"/></div><div className="os-grid os-main-grid"><Panel><PanelTitle title="Decision map" meta="XAUUSD · H1 context" action={<Badge tone="coral">BEARISH</Badge>}/><div className="decision-map"><div className="map-line"/>{["HTF bias","Structure shift","Valid impulse","0.71 POI","Liquidity sweep","Entry"].map((x,i)=><div className={`map-node ${i < 4 ? "done" : i === 4 ? "active" : ""}`} key={x}><span>{i < 4 ? "✓" : String(i+1).padStart(2,"0")}</span><div><b>{x}</b><small>{i < 4 ? "Confirmed" : i === 4 ? "Required next" : "Locked"}</small></div></div>)}</div></Panel><Panel><PanelTitle title="Canonical levels" meta="Mechanical references"/><div className="level-table">{[["0.95","Stop",fibPrice(.95),"coral"],["0.71","Primary POI",fibPrice(.71),"blue"],["0.00","TP1",fibPrice(0),"green"],["−0.21","TP2",fibPrice(-.21),"green"]].map(([level,name,price,tone])=><div className="level-row" key={String(level)}><span className={`level-dot ${tone}`}/><div><b>{name}</b><small>Fib {level}</small></div><strong>{fmt(Number(price))}</strong></div>)}</div></Panel></div><Panel className="process-panel"><PanelTitle title="Execution discipline" meta="The system is designed to prevent premature entries"/><div className="discipline-grid">{["External structure shift before Fibonacci","0.71 is the primary POI","Internal liquidity must be swept","0.95 SL / 0.00 TP1 / −0.21 TP2","No clear condition = no trade"].map((x,i)=><div key={x}><span>0{i+1}</span><p>{x}</p></div>)}</div></Panel></div>;
}

function LiveMarket() { return <div className="os-content"><PageHeader eyebrow="MARKET CENTER" title="Live Market" description="A clean market cockpit for XAU/USD. Live values are only shown when the provider is configured and responding." action={<Badge tone="amber">DEMO FEED</Badge>}/><div className="os-grid os-grid-4"><Stat label="XAU / USD" value={fmt(DEMO_SETUP.currentPrice)} meta="Demo reference" tone="amber"/><Stat label="CHANGE" value="+0.42%" meta="Illustrative only" tone="green"/><Stat label="SESSION" value="LONDON" meta="Current session"/><Stat label="FEED" value="READY" meta="Provider state" tone="green"/></div><div className="os-grid os-main-grid"><Panel className="market-cockpit"><PanelTitle title="Market context" meta="Chart module below · live data adapter ready"/><div className="market-price"><span>XAU/USD</span><strong>{fmt(DEMO_SETUP.currentPrice)}</strong><Badge tone="amber">DEMO</Badge></div><div className="mini-bars">{Array.from({length:32},(_,i)=><i key={i} style={{height:`${18 + ((i*17)%62)}%`}}/>)}</div></Panel><Panel><PanelTitle title="Timeframe matrix" meta="System view"/>{[["W1","BEARISH"],["D1","BEARISH"],["H4","BEARISH"],["H1","SHIFT"],["M15","RETRACE"],["M5","REFINE"]].map(([tf,v])=><div className="matrix-row" key={tf}><b>{tf}</b><span>{v}</span><i className={v === "SHIFT" ? "green" : v === "RETRACE" ? "amber" : "coral"}/></div>)}</Panel></div></div>; }

function POIMonitor() { return <div className="os-content"><PageHeader eyebrow="EXECUTION RADAR" title="POI Monitor" description="Watch the 0.71 zone without turning every tick into a trade signal." action={<Badge tone="blue">STATE CHANGE ONLY</Badge>}/><div className="os-grid os-grid-4"><Stat label="PRIMARY POI" value={fmt(fibPrice(.71))} meta="0.71 Fibonacci" tone="amber"/><Stat label="PRICE" value={fmt(DEMO_SETUP.currentPrice)} meta="Demo reference"/><Stat label="DISTANCE" value="+0.00" meta="Illustrative" tone="amber"/><Stat label="LIQUIDITY" value="PENDING" meta="Sweep required" tone="amber"/></div><Panel><PanelTitle title="POI state machine" meta="Refined entry model"/><div className="state-machine">{["Outside","Approaching","Inside POI","Liquidity sweep","Confirmed"].map((x,i)=><div className={`machine ${i < 3 ? "done" : i === 3 ? "active" : ""}`} key={x}><span>{i+1}</span><b>{x}</b>{i < 4 && <Icon name="arrow" size={15}/>}</div>)}</div><div className="alert-note"><Icon name="shield" size={18}/><div><b>Alert principle</b><p>Only meaningful state transitions should notify you. Repeated internal sweeps do not justify emotional stop movement.</p></div></div></Panel></div>; }

function Setups() { const rows = [["XAU/USD","Bearish","Inside POI","Liquidity pending","DEVELOPING"],["XAU/USD","Bullish","Structure failed","Invalidated","INVALID"],["XAU/USD","Bearish","TP2 reached","Complete","VALID"]]; return <div className="os-content"><PageHeader eyebrow="SETUP BOOK" title="Setups" description="A ranked queue of strategy-defined opportunities — not a signal feed." action={<Badge tone="blue">3 SCENARIOS</Badge>}/><Panel><div className="setup-list">{rows.map((r,i)=><motion.div whileHover={{x:2}} className="setup-row" key={i}><div className="setup-symbol"><span>{i+1}</span><div><b>{r[0]}</b><small>{r[1]} · H1</small></div></div><div><small>CONTEXT</small><b>{r[2]}</b></div><div><small>CONDITION</small><b>{r[3]}</b></div><Badge tone={r[4] === "VALID" ? "green" : r[4] === "INVALID" ? "coral" : "amber"}>{r[4]}</Badge><Icon name="chevron" size={17}/></motion.div>)}</div></Panel><Panel><PanelTitle title="What qualifies" meta="The queue stays empty when conditions are unclear"/><div className="qualify-grid">{["HTF direction","Structure shift","Valid impulse","Fib anchor","POI return","Internal sweep"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><b>{x}</b></div>)}</div></Panel></div>; }

function Journal() { return <div className="os-content"><PageHeader eyebrow="PERFORMANCE" title="Trading Journal" description="Turn execution into data. Track whether the plan was followed before judging the result." action={<button className="os-button primary">+ New entry</button>}/><div className="os-grid os-grid-4"><Stat label="TRADES" value="24" meta="This month"/><Stat label="FOLLOWED PLAN" value="83%" meta="Execution quality" tone="green"/><Stat label="AVG R" value="+1.12R" meta="Closed trades" tone="green"/><Stat label="BEST SESSION" value="NY" meta="Highest expectancy"/></div><Panel><PanelTitle title="Recent journal" meta="Demo records · replace with persistent storage"/><div className="journal-table"><div className="journal-head"><span>Date</span><span>Session</span><span>Bias</span><span>Outcome</span><span>Plan</span></div>{[["Sep 10","New York","Bearish","+3.8R","Followed"],["Sep 09","London","Bearish","−1.0R","Broken"],["Sep 08","Asia","Bullish","+1.9R","Followed"],["Sep 07","London","Bearish","BE","Followed"]].map(r=><div className="journal-row" key={r[0]}>{r.map((x,i)=><span className={i===3&&x.includes("+")?"green":i===3&&x.includes("−")?"coral":""} key={x}>{x}</span>)}</div>)}</div></Panel></div>; }

function Backtest() { return <div className="os-content"><PageHeader eyebrow="RESEARCH ENGINE" title="Backtest" description="Measure the rules before trusting the rules. No optimization theater." action={<Badge tone="blue">146 SETUPS</Badge>}/><div className="os-grid os-grid-4">{[["WIN RATE","38.4%"],["AVG R","+1.12R"],["EXPECTANCY","+0.43R"],["PROFIT FACTOR","1.56"]].map(([a,b],i)=><Stat key={a} label={a} value={b} meta="Historical demo sample" tone={i>0?"green":""}/>)}</div><div className="os-grid os-main-grid"><Panel><PanelTitle title="Equity profile" meta="Illustrative backtest curve"/><div className="equity-chart"><svg viewBox="0 0 720 220" preserveAspectRatio="none"><path d="M0 184 C70 172 90 180 140 145 S215 154 270 116 S350 126 405 93 S490 110 545 66 S620 82 720 28"/><line x1="0" x2="720" y1="184" y2="184"/></svg></div></Panel><Panel><PanelTitle title="Risk profile"/><div className="risk-profile">{[["Max drawdown","−8.4R"],["TP1 hit rate","57.5%"],["TP2 hit rate","34.2%"],["Sample size","146"]].map(x=><div className="risk-row" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></Panel></div></div>; }

function StrategyLab() { return <div className="os-content"><PageHeader eyebrow="RULES ENGINE" title="Strategy Lab" description="Your canonical model, expressed as inspectable rules rather than intuition."/><div className="os-grid os-grid-3">{[["01","Macro","Weekly + Daily define direction and key liquidity."],["02","Structure","H4/H1 shift must occur before the Fibonacci setup."],["03","Execution","Return to 0.71, then wait for internal liquidity."]].map(x=><Panel key={x[1]}><span className="lab-num">{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></Panel>)}</div><Panel><PanelTitle title="Canonical Fibonacci model" meta="Fixed until a tested rule change is approved"/><div className="fib-grid">{[["0.95","SL"],["0.71","PRIMARY POI"],["0.00","TP1"],["−0.21","TP2"]].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span></div>)}</div></Panel></div>; }

function Analytics() { return <div className="os-content"><PageHeader eyebrow="INTELLIGENCE" title="Analytics" description="A calm view of what is working, where the process leaks, and what deserves review."/><div className="os-grid os-grid-4"><Stat label="EXPECTANCY" value="+0.43R" meta="Per setup" tone="green"/><Stat label="PLAN ADHERENCE" value="83%" meta="Execution" tone="green"/><Stat label="LIQUIDITY SWEEP" value="61%" meta="Qualified setups"/><Stat label="REVENGE TRADES" value="3" meta="Needs attention" tone="coral"/></div><Panel><PanelTitle title="Process score" meta="Demo analytics"/><div className="process-score">{[["HTF alignment",92],["Structure confirmation",84],["POI discipline",88],["Liquidity patience",63],["Risk discipline",79]].map(x=><div key={x[0]}><div><span>{x[0]}</span><b>{x[1]}</b></div><div className="score-bar"><i style={{width:`${x[1]}%`}}/></div></div>)}</div></Panel></div>; }

function Psychology() { return <div className="os-content"><PageHeader eyebrow="PERFORMANCE MINDSET" title="Psychology" description="Protect the process from urgency, FOMO and revenge trading."/><div className="os-grid os-grid-3">{[["Before entry","Am I inside the defined conditions?"],["During trade","Can I leave the stop and targets untouched?"],["After trade","Did I follow the system regardless of outcome?"]].map(x=><Panel key={x[0]}><span className="os-eyebrow">CHECK {x[0].toUpperCase()}</span><h3>{x[1]}</h3><div className="mood-line"><span>Calm</span><span>Focused</span><span>Patient</span></div></Panel>)}</div><Panel className="quote-panel"><Icon name="shield" size={26}/><h3>“No setup is a position.”</h3><p>The highest-quality trade can be the one you correctly refused.</p></Panel></div>; }

function EconomicCalendar() { return <div className="os-content"><PageHeader eyebrow="MACRO WATCH" title="Economic Calendar" description="Macro events are context. They do not override your structure and execution rules." action={<Badge tone="amber">DEMO EVENTS</Badge>}/><Panel><div className="event-list">{[["12:30","HIGH","US CPI","Inflation data"],["14:00","HIGH","Fed Chair remarks","Policy commentary"],["15:30","MEDIUM","US crude inventories","Energy data"]].map(x=><div className="event-row" key={x[2]}><b>{x[0]}</b><Badge tone={x[1]==="HIGH"?"coral":"amber"}>{x[1]}</Badge><div><strong>{x[2]}</strong><small>{x[3]}</small></div><span>Today</span></div>)}</div></Panel></div>; }

function AIAssistant() { return <div className="os-content"><PageHeader eyebrow="DECISION SUPPORT" title="AI Assistant" description="AI explains verified system context. It should never invent a setup or override the deterministic rules." action={<Badge tone="blue">CONTEXT FIRST</Badge>}/><Panel className="ai-hero"><div className="ai-orb"><Icon name="spark" size={28}/></div><div><span className="os-eyebrow">POI TRADER INTELLIGENCE</span><h3>Ask about the current setup</h3><p>The assistant can summarize market state, explain why the setup is developing, and identify which predefined condition is still missing.</p><button className="os-button primary">Open assistant</button></div></Panel><div className="prompt-grid">{["Why is this setup not confirmed?","What condition comes next?","Explain the 0.71 POI rule","Summarize today's risk plan"].map(x=><button key={x}>{x}<Icon name="arrow" size={15}/></button>)}</div></div>; }

function Settings() { return <div className="os-content"><PageHeader eyebrow="SYSTEM CONTROL" title="Settings" description="Configure presentation and data behavior without changing the trading rules silently."/><div className="os-grid os-grid-2"><Panel><PanelTitle title="Market data" meta="Server-side credentials only"/><div className="setting-row"><div><b>Provider</b><small>Twelve Data</small></div><Badge tone="amber">KEY REQUIRED</Badge></div><div className="setting-row"><div><b>Symbol</b><small>XAU/USD</small></div><Badge tone="blue">ACTIVE</Badge></div><div className="setting-row"><div><b>Polling</b><small>30 second dashboard refresh</small></div><Badge>READY</Badge></div></Panel><Panel><PanelTitle title="Strategy protection" meta="These rules remain canonical"/><div className="setting-row"><div><b>Primary POI</b><small>0.71</small></div><strong>LOCKED</strong></div><div className="setting-row"><div><b>Stop reference</b><small>0.95</small></div><strong>LOCKED</strong></div><div className="setting-row"><div><b>Targets</b><small>0.00 / −0.21</small></div><strong>LOCKED</strong></div></Panel></div><Panel><PanelTitle title="Interface" meta="Premium light workspace"/><div className="interface-grid"><button className="selected">Light interface <span>●</span></button><button>Compact density <span>○</span></button><button>Reduce motion <span>○</span></button></div></Panel></div>; }

const views: Record<Tab, () => React.ReactNode> = { Overview, "Live Market": LiveMarket, "POI Monitor": POIMonitor, Setups, Journal, Backtest, "Strategy Lab": StrategyLab, Analytics, Psychology, "Economic Calendar": EconomicCalendar, "AI Assistant": AIAssistant, Settings };

export default function TradingOS() {
  const [active, setActive] = useState<Tab>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const Current = useMemo(() => views[active], [active]);
  return <div className="os-shell">
    <header className="os-header">
      <div className="os-brand"><div className="brand-mark"><span>POI</span></div><div><b>Trader OS</b><small>XAU/USD · SYSTEM</small></div></div>
      <div className="os-symbol"><span className="live-dot"/> XAU/USD <b>{fmt(DEMO_SETUP.currentPrice)}</b><Badge tone="amber">DEMO</Badge></div>
      <div className="os-header-actions"><button aria-label="Search" className="icon-button"><Icon name="search"/></button><button aria-label="Settings" className="icon-button" onClick={()=>setActive("Settings")}><Icon name="gear"/></button><div className="avatar">M</div><button className="mobile-menu icon-button" onClick={()=>setMobileOpen(v=>!v)}><Icon name="menu"/></button></div>
    </header>
    <aside className={`os-sidebar ${mobileOpen ? "open" : ""}`}><div className="sidebar-top"><span>WORKSPACE</span><button onClick={()=>setMobileOpen(false)} className="mobile-close">×</button></div>{["Workspace","Performance","Research","Tools"].map(group=><div className="nav-group" key={group}><span className="nav-label">{group}</span>{tabs.filter(t=>t.group===group).map(item=><button key={item.label} className={active===item.label?"active":""} onClick={()=>{setActive(item.label);setMobileOpen(false)}}><Icon name={item.icon}/><span>{item.label}</span>{active===item.label&&<i/>}</button>)}</div>)}</aside>
    <main className="os-main"><AnimatePresence mode="wait"><motion.div key={active} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:.18}}><Current/></motion.div></AnimatePresence></main>
    <nav className="os-mobile-nav">{tabs.slice(0,4).map(item=><button key={item.label} className={active===item.label?"active":""} onClick={()=>setActive(item.label)}><Icon name={item.icon} size={17}/><span>{item.label.replace(" Monitor","")}</span></button>)}</nav>
  </div>;
}
