"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEMO_SETUP, SETUP_STAGES, STRATEGY, fibPrice, fmt, setupReason, setupState } from "@/lib/strategy";
import "./trading-os-iphone.css";

type ViewId = "home" | "market" | "poi" | "setups" | "journal" | "performance" | "backtest" | "strategy" | "calendar" | "psychology" | "ai" | "settings";

type NavItem = { id: ViewId; label: string; icon: string };
const primary: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "market", label: "Market", icon: "pulse" },
  { id: "poi", label: "POI", icon: "target" },
  { id: "setups", label: "Setups", icon: "layers" },
  { id: "journal", label: "Journal", icon: "book" },
];
const secondary: NavItem[] = [
  { id: "performance", label: "Performance", icon: "chart" },
  { id: "backtest", label: "Backtest", icon: "rotate" },
  { id: "strategy", label: "Strategy", icon: "flask" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "psychology", label: "Psychology", icon: "brain" },
  { id: "ai", label: "AI Copilot", icon: "spark" },
  { id: "settings", label: "Settings", icon: "gear" },
];
const allNav = [...primary, ...secondary];

function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const p: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    pulse: <path d="M3 12h4l2-7 4 14 2-7h6"/>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 5.5V19a3 3 0 0 1 3-3h13"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 3 5-7"/></>,
    rotate: <><path d="M20 11a8 8 0 1 0 1 4"/><path d="M20 4v7h-7"/></>,
    flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></>,
    brain: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3"/><path d="M9 4v16M15 4v16"/></>,
    spark: <><path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4L12 3Z"/><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6L19 16Z"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19 15.2a2 2 0 0 0 .4 2.1l.1.1-2 2-.1-.1a2 2 0 0 0-2.1-.4 2 2 0 0 0-1.2 1.8V21h-3v-.3A2 2 0 0 0 11 19a2 2 0 0 0-2.1.4l-.1.1-2-2 .1-.1a2 2 0 0 0 .4-2.1A2 2 0 0 0 5.5 14H5v-3h.5a2 2 0 0 0 1.8-1.2A2 2 0 0 0 6.9 7.7l-.1-.1 2-2 .1.1A2 2 0 0 0 11 6a2 2 0 0 0 1.2-1.8V4h3v.3A2 2 0 0 0 16.5 6a2 2 0 0 0 2.1-.4l.1-.1 2 2-.1.1a2 2 0 0 0-.4 2.1 2 2 0 0 0 1.8 1.2h.3v3H22a2 2 0 0 0-1.8 1.3Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p[name] ?? p.home}</svg>;
}

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "green" | "amber" | "coral" }) {
  return <span className={`iphone-pill ${tone}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`iphone-card ${className}`}>{children}</section>;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="iphone-section-title"><div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div>{action}</div>;
}

function SetupHero() {
  const state = setupState();
  const current = DEMO_SETUP.stateIndex;
  const score = state === "VALID" ? 91 : state === "DEVELOPING" ? 72 : state === "WAIT" ? 44 : 18;
  return <Card className="setup-card">
    <div className="setup-card-top"><div><Pill tone="amber">DEMO MODE</Pill><span className="setup-system">SYSTEM EVALUATION</span></div><div className="score"><b>{score}</b><small>/100</small></div></div>
    <div className="setup-title"><div className="setup-icon"><Icon name="target" size={22}/></div><div><span className="setup-symbol">XAU / USD</span><h1>{state === "DEVELOPING" ? "Waiting for liquidity" : state === "VALID" ? "Setup confirmed" : "Setup incomplete"}</h1><p>{setupReason()}</p></div></div>
    <div className="setup-progress"><div className="progress-line"><i style={{ width: `${((current + 1) / SETUP_STAGES.length) * 100}%` }}/></div><div className="progress-meta"><span>{SETUP_STAGES[current]}</span><b>{current + 1}/{SETUP_STAGES.length}</b></div></div>
    <div className="setup-actions"><button className="primary-action">View POI <Icon name="arrow" size={15}/></button><button className="secondary-action">Why waiting?</button></div>
  </Card>;
}

function Home() {
  return <Page><div className="greeting"><div><span>TRADER OS</span><h1>Good session.</h1><p>Stay patient. Let the system earn the entry.</p></div><div className="profile">M</div></div><SetupHero/><div className="metric-grid"><Metric label="Weekly" value="Bearish" tone="coral"/><Metric label="Daily" value="Bearish" tone="coral"/><Metric label="H1" value="Shift" tone="green"/><Metric label="POI" value={fmt(fibPrice(STRATEGY.poi))} tone="amber"/></div><Card><SectionTitle eyebrow="DECISION ENGINE" title="Next condition" action={<Pill tone="amber">WAIT</Pill>}/><div className="next-condition"><div className="condition-icon"><Icon name="target" size={20}/></div><div><b>Internal liquidity sweep</b><p>Price must return to the 0.71 POI and sweep internal liquidity before an entry is considered.</p></div><span className="condition-arrow"><Icon name="arrow" size={16}/></span></div></Card><Card><SectionTitle eyebrow="RULES" title="Your execution map"/><RuleList/></Card></Page>;
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <div className="metric"><span>{label}</span><b className={tone}>{value}</b></div>; }
function RuleList() { return <div className="rule-list">{["HTF bias → structure shift","Valid impulse before Fibonacci","0.71 is the primary POI","Liquidity sweep inside POI","0.95 SL · 0.00 TP1 · −0.21 TP2"].map((x,i)=><div key={x}><i>{String(i+1).padStart(2,"0")}</i><span>{x}</span><Icon name="shield" size={15}/></div>)}</div>; }

function Market() { return <Page><PageTop eyebrow="MARKET" title="XAU / USD" pill="DEMO"><Pill tone="amber">Provider not connected</Pill></PageTop><Card className="price-card"><span>REFERENCE PRICE</span><strong>{fmt(DEMO_SETUP.currentPrice)}</strong><p>Demo value · not a live quote</p><div className="sparkline">{[35,42,30,52,46,64,58,72,66,78,61,70,82,74,88].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></Card><div className="market-list">{[["W1","Bearish","coral"],["D1","Bearish","coral"],["H4","Bearish","coral"],["H1","Shift confirmed","green"],["M15","Retracing","amber"],["M5","Optional refine","neutral"]].map(([tf,v,t])=><div className="market-row" key={tf}><b>{tf}</b><span>{v}</span><i className={t}/></div>)}</div><Card><SectionTitle eyebrow="CANONICAL LEVELS" title="Mechanical references"/><Level label="Stop" fib="0.95" price={fibPrice(.95)} tone="coral"/><Level label="Primary POI" fib="0.71" price={fibPrice(.71)} tone="blue"/><Level label="TP1" fib="0.00" price={fibPrice(0)} tone="green"/><Level label="TP2" fib="−0.21" price={fibPrice(-.21)} tone="green"/></Card></Page>; }
function Level({ label, fib, price, tone }: { label: string; fib: string; price: number; tone: string }) { return <div className="level"><i className={tone}/><div><b>{label}</b><small>Fib {fib}</small></div><strong>{fmt(price)}</strong></div>; }

function POI() { const state = setupState(); return <Page><PageTop eyebrow="POI RADAR" title="One setup. One decision." pill={state === "DEVELOPING" ? "WAIT" : state}/><Card className="poi-focus"><div className="poi-orbit"><div className="orbit-ring"/><div><span>0.71</span><small>PRIMARY POI</small></div></div><div className="poi-copy"><Pill tone="blue">XAU / USD</Pill><h2>{fmt(fibPrice(STRATEGY.poi))}</h2><p>Primary point of interest</p><div className="wait-banner"><Icon name="pulse" size={17}/><div><b>Waiting for liquidity</b><span>Internal sweep required before entry.</span></div></div></div></Card><Card><SectionTitle eyebrow="SEQUENCE" title="Setup progression"/><div className="vertical-sequence">{SETUP_STAGES.map((stage,i)=><div className={`seq ${i < DEMO_SETUP.stateIndex ? "done" : i === DEMO_SETUP.stateIndex ? "current" : ""}`} key={stage}><span>{i < DEMO_SETUP.stateIndex ? "✓" : i+1}</span><div><b>{stage}</b>{i === DEMO_SETUP.stateIndex && <small>Current condition</small>}</div></div>)}</div></Card></Page>; }

function Setups() { return <Page><PageTop eyebrow="SETUPS" title="Setup watchlist" pill="1 developing"/><div className="setup-list-mobile"><Watch title="XAU/USD" state="Developing" detail="Inside / approaching 0.71 POI" tone="amber"/><Watch title="XAU/USD" state="Invalid" detail="Previous session · archived" tone="neutral"/><Watch title="XAU/USD" state="Confirmed" detail="No active trade · monitor only" tone="green"/></div><Card className="empty-card"><div className="empty-icon"><Icon name="layers" size={22}/></div><h3>No active execution</h3><p>A setup becomes actionable only after every required condition is confirmed.</p></Card></Page>; }
function Watch({ title,state,detail,tone }: { title:string; state:string; detail:string; tone:string }) { return <Card className="watch"><div className="watch-top"><div><span>{title}</span><h3>{state}</h3></div><Pill tone={tone as "neutral"}>{state}</Pill></div><p>{detail}</p><div className="watch-bar"><i style={{width:state === "Confirmed" ? "100%" : state === "Developing" ? "72%" : "28%"}}/></div></Card>; }

function Journal() { return <Page><PageTop eyebrow="JOURNAL" title="Trading journal" pill="Private"/><Card className="journal-hero"><span>DISCIPLINE SCORE</span><strong>—</strong><p>Start recording executions to measure process quality.</p><button className="primary-action">Log a trade <Icon name="arrow" size={15}/></button></Card><div className="metric-grid two"><Metric label="Trades" value="0"/><Metric label="Win rate" value="—"/><Metric label="R multiple" value="—"/><Metric label="Rule breaks" value="0"/></div><Card><SectionTitle title="Recent activity"/><div className="empty-inline"><span>No journal entries yet.</span></div></Card></Page>; }

function Generic({ id }: { id: ViewId }) { const item = allNav.find(x=>x.id===id)!; const copy: Record<string,string> = { performance:"Review expectancy, risk discipline and execution quality.", backtest:"Test the exact POI sequence without changing the rules mid-test.", strategy:"Keep the canonical 0.71 / 0.95 / 0 / −0.21 framework visible and mechanical.", calendar:"Keep macro events visible before committing to execution.", psychology:"Track patience, risk behavior and rule adherence — not emotions alone.", ai:"AI explanations should use verified market context and never invent a setup.", settings:"Market provider, display, notifications and execution preferences." }; return <Page><PageTop eyebrow="WORKSPACE" title={item.label} pill="Coming together"/><Card className="generic-hero"><div className="generic-icon"><Icon name={item.icon} size={24}/></div><h2>{item.label}</h2><p>{copy[id]}</p><div className="feature-list"><span>Designed for one-handed use</span><span>Strategy-first decision flow</span><span>No broker auto-execution</span></div></Card><Card><SectionTitle eyebrow="SYSTEM STANDARD" title="Built around your rules"/><RuleList/></Card></Page>; }

function Page({ children }: { children: ReactNode }) { return <div className="iphone-page">{children}</div>; }
function PageTop({ eyebrow,title,pill,children }: { eyebrow:string; title:string; pill?:string; children?:ReactNode }) { return <div className="page-top"><div><span>{eyebrow}</span><h1>{title}</h1></div><div className="page-top-right">{children}{pill && <Pill tone={pill === "WAIT" ? "amber" : "neutral"}>{pill}</Pill>}</div></div>; }

export default function TradingOS() {
  const [active,setActive] = useState<ViewId>("home");
  const [moreOpen,setMoreOpen] = useState(false);
  const go = (id:ViewId) => { setActive(id); setMoreOpen(false); window.scrollTo({top:0,behavior:"smooth"}); };
  const view = active === "home" ? <Home/> : active === "market" ? <Market/> : active === "poi" ? <POI/> : active === "setups" ? <Setups/> : active === "journal" ? <Journal/> : <Generic id={active}/>;
  return <div className="iphone-os">
    <header className="iphone-header"><button className="brand-button" onClick={()=>go("home")} aria-label="Home"><span className="brand-orb">POI</span><div><b>Trader OS</b><small>XAU / USD</small></div></button><div className="header-status"><span className="status-dot"/> <b>DEMO</b></div><button className="header-icon" onClick={()=>setMoreOpen(true)} aria-label="Open menu"><Icon name="menu" size={20}/></button></header>
    <aside className="desktop-rail"><div className="rail-brand"><span className="brand-orb">POI</span><b>Trader OS</b></div><nav>{primary.map(item=><NavButton key={item.id} item={item} active={active} onClick={go}/>)}<div className="rail-divider"/><span className="rail-label">MORE</span>{secondary.map(item=><NavButton key={item.id} item={item} active={active} onClick={go}/>)}</nav><div className="rail-foot"><Pill tone="amber">DEMO</Pill><span>Rules locked</span></div></aside>
    <main className="iphone-main">{view}</main>
    <nav className="bottom-bar">{primary.map(item=><button key={item.id} className={active===item.id?"active":""} onClick={()=>go(item.id)}><Icon name={item.icon} size={20}/><span>{item.label}</span></button>)}<button className={moreOpen?"active":""} onClick={()=>setMoreOpen(true)}><Icon name="menu" size={20}/><span>More</span></button></nav>
    <AnimatePresence>{moreOpen && <><motion.button className="sheet-backdrop" aria-label="Close menu" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setMoreOpen(false)}/><motion.section className="more-sheet" initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:360,damping:32}}><div className="sheet-grabber"/><div className="sheet-head"><div><span>TRADER OS</span><h2>More</h2></div><button onClick={()=>setMoreOpen(false)}>Done</button></div><div className="more-grid">{secondary.map(item=><button key={item.id} onClick={()=>go(item.id)}><span><Icon name={item.icon} size={20}/></span><b>{item.label}</b><small>Open</small></button>)}</div></motion.section></AnimatePresence>}
  </div>;
}

function NavButton({ item, active, onClick }: { item:NavItem; active:ViewId; onClick:(id:ViewId)=>void }) { return <button className={`rail-item ${active===item.id?"active":""}`} onClick={()=>onClick(item.id)}><Icon name={item.icon} size={18}/><span>{item.label}</span>{active===item.id && <i/>}</button>; }
