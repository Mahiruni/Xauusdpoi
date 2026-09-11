"use client";

import { FormEvent, useMemo, useState } from "react";
import { DEMO_SETUP, SETUP_STAGES, STRATEGY, fibPrice, fmt, setupReason, setupState } from "@/lib/strategy";

type Tab = "Overview" | "Live Market" | "POI Monitor" | "Setups" | "Journal" | "Backtest" | "Strategy Lab" | "Analytics" | "Psychology" | "Economic Calendar" | "AI Assistant" | "Settings";

type JournalRow = { date: string; session: string; bias: string; outcome: string; followed: boolean };

type ChatMessage = { role: "user" | "ai"; text: string; status?: "CONFIRMED" | "DEVELOPING" | "INVALID" | "UNKNOWN" };

const tabs: { label: Tab; icon: string }[] = [
  { label: "Overview", icon: "◫" },
  { label: "Live Market", icon: "⌁" },
  { label: "POI Monitor", icon: "◎" },
  { label: "Setups", icon: "◇" },
  { label: "Journal", icon: "▤" },
  { label: "Backtest", icon: "↺" },
  { label: "Strategy Lab", icon: "⚗" },
  { label: "Analytics", icon: "⌁" },
  { label: "Psychology", icon: "◌" },
  { label: "Economic Calendar", icon: "□" },
  { label: "AI Assistant", icon: "✦" },
  { label: "Settings", icon: "⚙" },
];

const initialJournal: JournalRow[] = [
  { date: "Sep 10", session: "New York", bias: "Bearish", outcome: "+3.8R", followed: true },
  { date: "Sep 09", session: "London", bias: "Bearish", outcome: "−1.0R", followed: false },
  { date: "Sep 08", session: "Asia", bias: "Bullish", outcome: "+1.9R", followed: true },
  { date: "Sep 07", session: "London", bias: "Bearish", outcome: "BE", followed: true },
];

const backtestMetrics = [
  ["Total setups", "146"], ["Win rate", "38.4%"], ["Avg R", "+1.12R"], ["Expectancy", "+0.43R"],
  ["Profit factor", "1.56"], ["Max drawdown", "−8.4R"], ["TP1 hit rate", "57.5%"], ["TP2 hit rate", "34.2%"],
];

const sweepStats = [
  { label: "1 sweep", value: 49 }, { label: "2 sweeps", value: 29 }, { label: "3 sweeps", value: 15 }, { label: "4+ sweeps", value: 7 },
];

const economicEvents = [
  { time: "12:30", impact: "High", name: "US CPI", meta: "Demo calendar event" },
  { time: "14:00", impact: "High", name: "Fed Chair remarks", meta: "Demo calendar event" },
  { time: "15:30", impact: "Medium", name: "US crude inventories", meta: "Demo calendar event" },
];

const moods = ["Calm", "Confident", "Fearful", "Frustrated", "Revenge trading", "FOMO", "Tired", "Overconfident"];

function Chip({ children, tone = "amber" }: { children: React.ReactNode; tone?: "amber" | "green" | "red" | "blue" }) {
  return <span className={`chip ${tone}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="sectionTitle"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action}</div>;
}

function Kpi({ label, value, meta, tone = "" }: { label: string; value: string; meta: string; tone?: "red" | "green" | "amber" | "" }) {
  return <Card className="kpi"><div className="kpiLabel">{label}</div><div className={`kpiValue ${tone ? `value-${tone}` : ""}`}>{value}</div><div className="kpiMeta">{meta}</div></Card>;
}

function MarketChart() {
  const candles = useMemo(() => {
    const base = [3658,3652,3660,3656,3667,3662,3670,3659,3651,3645,3638,3632,3625,3631,3637,3644,3650,3657,3660,3655,3649,3642,3638,3634];
    return base.map((close, i) => ({ x: 36 + i * 27, open: close + (i % 3 === 0 ? -5 : 4), close, high: Math.max(close, close + (i % 3 === 0 ? -5 : 4)) + 5, low: Math.min(close, close + (i % 3 === 0 ? -5 : 4)) - 5 }));
  }, []);
  const min = 3605, max = 3685;
  const y = (price: number) => 300 - ((price - min) / (max - min)) * 250;
  const poi = fibPrice(STRATEGY.poi), sl = fibPrice(STRATEGY.stop), tp1 = fibPrice(STRATEGY.tp1), tp2 = fibPrice(STRATEGY.tp2);
  return <div className="chartWrap"><div className="chartBadge">DEMO CHART</div><svg viewBox="0 0 720 330" role="img" aria-label="Demo XAUUSD chart with Fibonacci POI levels">
    {[0,1,2,3,4].map(i => <line key={i} x1="20" x2="700" y1={55+i*55} y2={55+i*55} className="gridLine" />)}
    <rect x="20" y={y(sl)} width="680" height={Math.max(6, y(poi)-y(sl))} className="poiZone" />
    {[[sl,"0.95 SL"],[poi,"0.71 POI"],[tp1,"TP1 0.00"],[tp2,"TP2 −0.21"]].map(([p,label]) => <g key={String(label)}><line x1="20" x2="700" y1={y(Number(p))} y2={y(Number(p))} className={String(label).includes("POI") ? "levelLineSvg poiLine" : "levelLineSvg"}/><text x="610" y={y(Number(p))-5} className="levelText">{label}</text></g>)}
    {candles.map((c, i) => { const up = c.close >= c.open; const top = y(Math.max(c.open,c.close)); const bottom = y(Math.min(c.open,c.close)); return <g key={i} className={up ? "candle up" : "candle down"}><line x1={c.x} x2={c.x} y1={y(c.high)} y2={y(c.low)}/><rect x={c.x-5} width="10" y={top} height={Math.max(2,bottom-top)} rx="1"/></g>; })}
  </svg></div>;
}

function FibLevels() {
  const levels = [["1.00",1,"Swing origin"],["0.95",.95,"Stop reference"],["0.71",.71,"Primary POI"],["0.00",0,"TP1"],["−0.21",-.21,"TP2"]] as const;
  return <div className="levelList">{levels.map(([label,level,meta]) => <div className={`levelRow ${level===.71 ? "poi" : ""}`} key={label}><div><div className="levelKey">{label}</div><div className="subtle">{meta}</div></div><div className="levelLine"/><div className="levelPrice">{fmt(fibPrice(level))}</div></div>)}</div>;
}

function SetupTimeline() {
  return <div className="timeline">{SETUP_STAGES.map((name,index) => <div className={`stage ${index < DEMO_SETUP.stateIndex ? "done" : index === DEMO_SETUP.stateIndex ? "current" : ""}`} key={name}><div className="stageNum">{String(index+1).padStart(2,"0")}</div><div className="stageName">{name}</div></div>)}</div>;
}

function StatusHero() {
  const state = setupState();
  const score = state === "VALID" ? 91 : state === "DEVELOPING" ? 72 : 45;
  return <section className="statusHero"><div><div className="statusTag">● {state}</div><div className="statusTitle">Does the market satisfy Mahir’s system?</div><p className="statusCopy">{setupReason()}</p></div><div className="scoreRing" style={{ "--score": `${score}%` } as React.CSSProperties}><span>{score}%</span></div></section>;
}

function RiskCalculator() {
  const [balance,setBalance] = useState(500);
  const [riskPct,setRiskPct] = useState(.5);
  const [entry,setEntry] = useState(fibPrice(.71));
  const [stop,setStop] = useState(fibPrice(.95));
  const riskAmount = balance * (riskPct/100);
  const distance = Math.abs(stop-entry);
  const rawSize = distance > 0 ? riskAmount/distance : 0;
  return <div><div className="formGrid"><label className="field">Account balance<input type="number" value={balance} onChange={e=>setBalance(Number(e.target.value)||0)}/></label><label className="field">Risk %<select value={riskPct} onChange={e=>setRiskPct(Number(e.target.value))}><option value="0.25">0.25%</option><option value="0.5">0.50%</option><option value="1">1.00%</option></select></label><label className="field">Entry<input type="number" step="0.01" value={entry} onChange={e=>setEntry(Number(e.target.value)||0)}/></label><label className="field">Stop<input type="number" step="0.01" value={stop} onChange={e=>setStop(Number(e.target.value)||0)}/></label></div><div className="metricList compactMetrics"><div className="metricBox"><span>Risk amount</span><strong>${riskAmount.toFixed(2)}</strong></div><div className="metricBox"><span>Stop distance</span><strong>{distance.toFixed(2)}</strong></div><div className="metricBox"><span>Raw size factor</span><strong>{rawSize.toFixed(3)}</strong></div></div><p className="subtle">Planning aid only. Broker contract sizing must be verified before live use.</p></div>;
}

function Overview() {
  const distance = DEMO_SETUP.currentPrice - fibPrice(.71);
  const plan = ["Weekly direction","Daily direction","Important liquidity","H4/H1 structure","Valid impulse","Fibonacci anchored","Wait for POI","Wait for liquidity","Execute only if aligned"];
  return <><StatusHero/><SectionTitle title="Market context" description="Demo state — replace with a verified market-data provider before live use." action={<Chip>DEMO / NOT LIVE</Chip>}/><div className="grid grid4"><Kpi label="WEEKLY BIAS" value="BEARISH" meta="Higher-timeframe direction" tone="red"/><Kpi label="DAILY BIAS" value="BEARISH" meta="Aligned with weekly" tone="red"/><Kpi label="H1 STRUCTURE" value="SHIFT" meta="Closed-candle external shift" tone="green"/><Kpi label="POI DISTANCE" value={`${distance >= 0 ? "+" : ""}${fmt(distance)}`} meta="Price minus 0.71" tone="amber"/></div><SectionTitle title="Active setup" description="Valid impulse → Fibonacci → POI → liquidity." action={<Chip tone="red">BEARISH</Chip>}/><div className="grid gridMain"><Card><div className="cardHead"><div><div className="eyebrow">XAUUSD • H1 CONTEXT</div><h2>Structure & Fibonacci</h2></div></div><MarketChart/></Card><div className="stack"><Card className="pad"><div className="eyebrow">FIBONACCI LEVELS</div><h2>Canonical setup</h2><FibLevels/></Card><Card className="pad"><div className="eyebrow">LIQUIDITY CONDITION</div><div className="split"><h2>Waiting</h2><Chip>NOT SWEPT</Chip></div><p className="subtle">Price is inside the POI in this demo, but internal liquidity confirmation is still pending.</p></Card></div></div><SectionTitle title="Setup state" description="Only meaningful state transitions should trigger alerts."/><Card className="pad"><SetupTimeline/></Card><div className="grid grid2 spacedTop"><Card className="pad"><div className="eyebrow">TODAY’S PLAN</div><h2>One process. No improvisation.</h2><div className="checklist">{plan.map((item,i)=><label className="check" key={item}><input type="checkbox" defaultChecked={i<6}/><span>{item}</span></label>)}</div><div className="noTrade">NO SETUP = NO TRADE.</div></Card><Card className="pad"><div className="eyebrow">RISK CALCULATOR</div><h2>Make the loss small enough to follow the plan.</h2><RiskCalculator/></Card></div></>;
}

function LiveMarket() { return <><SectionTitle title="Live Market" description="Prepared for a verified realtime XAUUSD provider." action={<Chip>DEMO FEED</Chip>}/><div className="grid grid4"><Kpi label="XAUUSD" value={fmt(DEMO_SETUP.currentPrice)} meta="Demo price" tone="amber"/><Kpi label="WEEKLY" value="BEARISH" meta="Demo bias" tone="red"/><Kpi label="H1" value="SHIFT" meta="External bearish shift" tone="green"/><Kpi label="SESSION" value="LONDON" meta="Demo session"/></div><div className="grid gridMain spacedTop"><Card><MarketChart/></Card><Card className="pad"><div className="eyebrow">ACTIVE FIBONACCI</div><h2>Verified anchors required in live mode</h2><FibLevels/></Card></div></>; }

function PoiMonitor() { return <><SectionTitle title="POI Monitor" description="Track approach, entry, liquidity formation, sweep and invalidation." action={<Chip>STATE-CHANGE ALERTS</Chip>}/><div className="grid grid4"><Kpi label="POI" value={fmt(fibPrice(.71))} meta="0.71 Fibonacci" tone="amber"/><Kpi label="CURRENT" value={fmt(DEMO_SETUP.currentPrice)} meta="Demo price"/><Kpi label="STATE" value="INSIDE POI" meta="Demo condition" tone="amber"/><Kpi label="LIQUIDITY" value="PENDING" meta="Sweep required" tone="amber"/></div><div className="grid grid2 spacedTop"><Card className="pad"><div className="eyebrow">POI LEVELS</div><FibLevels/></Card><Card className="pad"><div className="eyebrow">ALERT LOGIC</div><h2>Notify only when state changes</h2><div className="alertFlow"><span>OUTSIDE</span><b>→</b><span>APPROACHING</span><b>→</b><span>INSIDE</span><b>→</b><span>LIQUIDITY</span><b>→</b><span>CONFIRMED</span></div><p className="subtle">Background monitoring belongs on the server so it can continue while this page is closed.</p></Card></div><SectionTitle title="Current setup state" description="Liquidity confirmation is required in the refined entry model."/><Card className="pad"><SetupTimeline/></Card></>; }

function Setups() {
  const rows = [["XAUUSD","Bearish","Inside POI","Waiting liquidity","DEVELOPING"],["XAUUSD","Bullish","Invalidated","Structure failed","INVALID"],["XAUUSD","Bearish","TP2 hit","Complete","VALID"]];
  return <><SectionTitle title="Setups" description="Audit developing, valid and invalid opportunities."/><Card className="pad"><div className="tableWrap"><table><thead><tr><th>Instrument</th><th>Direction</th><th>POI state</th><th>Condition</th><th>Status</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.slice(0,4).map((c,j)=><td key={j}>{c}</td>)}<td><Chip tone={r[4]==="VALID"?"green":r[4]==="INVALID"?"red":"amber"}>{r[4]}</Chip></td></tr>)}</tbody></table></div></Card></>;
}

function Journal({ rows, setRows }: { rows: JournalRow[]; setRows: React.Dispatch<React.SetStateAction<JournalRow[]>> }) {
  const [saved,setSaved] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setRows(r=>[{date:"Today",session:"London",bias:"Bearish",outcome:"Open",followed:true},...r]); setSaved(true); }
  return <><SectionTitle title="Journal" description="Separate strategy performance from execution discipline." action={<Chip>LOCAL DEMO FORM</Chip>}/><div className="grid grid2"><Card className="pad"><div className="eyebrow">NEW JOURNAL ENTRY</div><h2>Document the process, not the story</h2><form className="formGrid" onSubmit={submit}><label className="field">Session<select><option>Asia</option><option>London</option><option>New York</option></select></label><label className="field">Bias<select><option>Bearish</option><option>Bullish</option><option>Neutral</option></select></label><label className="field">Entry<input defaultValue={fmt(fibPrice(.71))}/></label><label className="field">Stop<input defaultValue={fmt(fibPrice(.95))}/></label><label className="field full">Notes<textarea placeholder="What happened objectively?"/></label><label className="check full"><input type="checkbox"/>Did I follow my rules?</label><button className="btn primary" type="submit">Save demo entry</button>{saved?<span className="saveNote">Saved in local UI state. Connect Supabase for persistence.</span>:null}</form></Card><Card className="pad"><div className="eyebrow">RECENT ENTRIES</div><div className="tableWrap"><table><thead><tr><th>Date</th><th>Session</th><th>Bias</th><th>Outcome</th><th>Rules</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.date}-${i}`}><td>{r.date}</td><td>{r.session}</td><td>{r.bias}</td><td>{r.outcome}</td><td>{r.followed?<Chip tone="green">YES</Chip>:<Chip tone="red">NO</Chip>}</td></tr>)}</tbody></table></div></Card></div></>;
}

function Backtest() { return <><SectionTitle title="Backtest" description="Illustrative values only until a verified historical feed is connected." action={<Chip>DEMO METRICS</Chip>}/><Card className="pad"><div className="metricList">{backtestMetrics.map(([l,v])=><div className="metricBox" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div></Card><div className="grid grid2 spacedTop"><Card className="pad"><div className="eyebrow">LIQUIDITY SWEEPS BEFORE REVERSAL</div><h2>How often does price keep taking liquidity?</h2><div className="bars">{sweepStats.map(s=><div className="barCol" key={s.label}><div className="barValue">{s.value}%</div><div className="bar" style={{height:`${s.value*2.3}px`}}/><div className="barLabel">{s.label}</div></div>)}</div></Card><Card className="pad"><div className="eyebrow">BACKTEST WINDOWS</div><h2>Prepared for historical provider</h2><div className="buttonGrid">{["1 month","3 months","1 year","3 years","5 years"].map(v=><button className="btn" key={v}>{v}</button>)}</div><p className="subtle">Never treat demo metrics as measured performance.</p></Card></div></>; }

function StrategyLab() {
  const [entry,setEntry]=useState("0.71"), [stop,setStop]=useState("0.95"), [tp,setTp]=useState("-0.21");
  return <><SectionTitle title="Strategy Lab" description="Experiment without changing the locked production framework." action={<Chip tone="blue">TEST ONLY</Chip>}/><div className="grid grid2"><Card className="pad"><div className="eyebrow">PRODUCTION SYSTEM • LOCKED</div><div className="ruleLock">{[["Entry / POI","0.71"],["Stop","0.95"],["TP1","0.00"],["TP2","−0.21"]].map(([l,v])=><div className="lockItem" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div></Card><Card className="pad"><div className="eyebrow">EXPERIMENT</div><div className="formGrid"><label className="field">Entry<select value={entry} onChange={e=>setEntry(e.target.value)}>{["0.618","0.705","0.71","0.786"].map(v=><option key={v}>{v}</option>)}</select></label><label className="field">Stop<select value={stop} onChange={e=>setStop(e.target.value)}>{["0.90","0.95","1.00"].map(v=><option key={v}>{v}</option>)}</select></label><label className="field">TP2<select value={tp} onChange={e=>setTp(e.target.value)}>{["0","-0.21","-0.27"].map(v=><option key={v}>{v}</option>)}</select></label></div><div className="experimentSummary">Testing {entry} / {stop} / 0 / {tp}</div></Card></div></>;
}

function Analytics() { return <><SectionTitle title="Analytics" description="Understand strategy edge, sessions, execution and rule adherence."/><div className="grid grid3"><Card className="pad"><div className="eyebrow">RULE ADHERENCE</div><div className="bigMetric">78%</div><p>Demo: trades where predefined rules were followed.</p></Card><Card className="pad"><div className="eyebrow">LOSSES AFTER VIOLATIONS</div><div className="bigMetric redText">67%</div><p>Demo statistic only.</p></Card><Card className="pad"><div className="eyebrow">BEST SESSION</div><div className="bigMetric">LONDON</div><p>Demo session analysis.</p></Card></div><div className="grid grid2 spacedTop"><Card className="pad"><div className="eyebrow">STRATEGY FAILURE VS EXECUTION FAILURE</div><h2>Keep the two separate</h2><p>Backtesting should measure the rules exactly as written. Journal analytics should measure whether you followed those rules. Do not change the strategy because of an execution mistake.</p></Card><Card className="pad"><div className="eyebrow">WEEKLY REVIEW</div><h2>Reflect → Adjust → Improve</h2><p>Use a statistically meaningful sample before modifying the canonical 0.71 / 0.95 / 0 / −0.21 framework.</p></Card></div></>; }

function Psychology() { const [selected,setSelected]=useState("Calm"); return <><SectionTitle title="Psychology" description="Capture state before execution so emotion can be measured instead of guessed."/><Card className="pad"><div className="eyebrow">HOW ARE YOU FEELING?</div><div className="moodGrid">{moods.map(m=><button key={m} className={`mood ${selected===m?"selected":""}`} onClick={()=>setSelected(m)}>{m}</button>)}</div><div className="psychResult">Current state: <strong>{selected}</strong></div></Card><div className="grid grid3 spacedTop"><Card className="pad"><div className="eyebrow">MOST COMMON VIOLATION</div><div className="bigMetric">Moved SL</div></Card><Card className="pad"><div className="eyebrow">BEST STATE</div><div className="bigMetric">Calm</div></Card><Card className="pad"><div className="eyebrow">WEEKLY FOCUS</div><div className="bigMetric">Wait</div></Card></div></>; }

function Calendar() { return <><SectionTitle title="Economic Calendar" description="Surface high-impact USD risk without turning news into a trade signal." action={<Chip>DEMO EVENTS</Chip>}/><Card className="pad">{economicEvents.map(e=><div className="calendarEvent" key={e.time+e.name}><div className="eventTime">{e.time}</div><Chip tone={e.impact==="High"?"red":"amber"}>{e.impact}</Chip><div><div className="eventName">{e.name}</div><div className="eventMeta">{e.meta}</div></div></div>)}</Card></>; }

function Assistant() {
  const suggestions = ["Where is XAUUSD relative to my POI?","Has liquidity been taken?","Is this swing valid?","Did I break my rules yesterday?"];
  const [messages,setMessages]=useState<ChatMessage[]>([{role:"ai",text:"Ask me about your strategy. I will distinguish confirmed, developing, invalid and unknown conditions."}]); const [input,setInput]=useState("");
  function send(q:string){ if(!q.trim()) return; const l=q.toLowerCase(); let response: ChatMessage; if(l.includes("liquidity")) response={role:"ai",status:"DEVELOPING",text:"Demo state: price is inside the 0.71 POI, but the required internal liquidity sweep is still pending."}; else if(l.includes("swing")) response={role:"ai",status:"CONFIRMED",text:"The demo swing is tagged as the impulse leg that caused the external H1 shift. Live mode must verify this from closed-candle structure."}; else if(l.includes("rules")) response={role:"ai",status:"UNKNOWN",text:"Persistent journal data is not connected yet, so I cannot honestly determine yesterday’s rule adherence."}; else response={role:"ai",status:"DEVELOPING",text:"In demo mode XAUUSD is at the POI stage and is still waiting for liquidity confirmation."}; setMessages(m=>[...m,{role:"user",text:q},response]); setInput(""); }
  return <><SectionTitle title="AI Assistant" description="Strategy-aware analysis that must never fabricate market state." action={<Chip>DEMO LOGIC</Chip>}/><Card className="assistantShell"><aside className="assistantSide"><div className="eyebrow">SUGGESTED</div><div className="suggested">{suggestions.map(s=><button className="btn ghost" onClick={()=>send(s)} key={s}>{s}</button>)}</div></aside><div className="assistantMain"><div className="chatLog">{messages.map((m,i)=><div className={`msg ${m.role}`} key={i}>{m.status?<Chip tone={m.status==="CONFIRMED"?"green":m.status==="INVALID"?"red":m.status==="UNKNOWN"?"blue":"amber"}>{m.status}</Chip>:null}<p>{m.text}</p></div>)}</div><form className="chatInput" onSubmit={e=>{e.preventDefault();send(input)}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about your setup..."/><button className="btn primary">Send</button></form></div></Card></>;
}

function Settings() { const integrations=[["Realtime XAUUSD feed","Not connected"],["Historical data","Not connected"],["Supabase persistence","Ready to configure"],["Economic calendar","Demo only"],["Browser push","UI ready"],["Telegram","Placeholder"],["Email alerts","Placeholder"]]; return <><SectionTitle title="Settings" description="Production integrations and safety controls." action={<Chip tone="blue">NO BROKER EXECUTION</Chip>}/><div className="grid grid2"><Card className="pad"><div className="eyebrow">INTEGRATIONS</div>{integrations.map(([a,b])=><div className="switchRow" key={a}><div><strong>{a}</strong><span>{b}</span></div><button className="btn ghost">Configure</button></div>)}</Card><Card className="pad"><div className="eyebrow">SAFETY</div><h2>Analysis and discipline only</h2><p>No broker auto-execution or real-money movement is included. API secrets belong on the server. Keep live mode disabled until the feed and symbol specifications are verified.</p><div className="callout">NEXT_PUBLIC_DEMO_MODE=true</div></Card></div></>; }

function Screen({ tab, rows, setRows }: { tab: Tab; rows: JournalRow[]; setRows: React.Dispatch<React.SetStateAction<JournalRow[]>> }) {
  if(tab==="Overview") return <Overview/>;
  if(tab==="Live Market") return <LiveMarket/>;
  if(tab==="POI Monitor") return <PoiMonitor/>;
  if(tab==="Setups") return <Setups/>;
  if(tab==="Journal") return <Journal rows={rows} setRows={setRows}/>;
  if(tab==="Backtest") return <Backtest/>;
  if(tab==="Strategy Lab") return <StrategyLab/>;
  if(tab==="Analytics") return <Analytics/>;
  if(tab==="Psychology") return <Psychology/>;
  if(tab==="Economic Calendar") return <Calendar/>;
  if(tab==="AI Assistant") return <Assistant/>;
  return <Settings/>;
}

export default function TradingOS() {
  const [tab,setTab]=useState<Tab>("Overview");
  const [rows,setRows]=useState(initialJournal);
  const mobileTabs = new Set<Tab>(["Overview","Live Market","POI Monitor","Journal","AI Assistant"]);
  return <div className="appShell"><aside className="sidebar"><div className="brand"><span className="brandMark">P</span><div><div className="brandName">POI Trader OS</div><div className="brandSub">XAUUSD discipline system</div></div></div><nav className="nav">{tabs.map(t=><button key={t.label} className={`navBtn ${tab===t.label?"active":""}`} onClick={()=>setTab(t.label)}><span className="navIcon">{t.icon}</span><span>{t.label}</span></button>)}</nav><div className="sidebarFooter"><div className="miniCard"><div className="miniLabel">Canonical system</div><div className="miniValue">0.71 / 0.95 / 0 / −0.21</div><div className="miniCopy">Locked production rules</div></div><div className="copyright">Reflect → Adjust → Improve</div></div></aside><div className="mainWrap"><header className="topbar"><div><div className="eyebrow">DISCIPLINED EXECUTION</div><h1>{tab}</h1></div><div className="topbarActions"><span className="pill demoPill">DEMO DATA</span><span className="pill marketOpen"><span className="dot dot-green"/> MARKET OPEN</span><button className="iconBtn" aria-label="Notifications">🔔<span className="badgeCount">3</span></button></div></header><main className="content"><Screen tab={tab} rows={rows} setRows={setRows}/></main><footer className="siteFooter">Built for disciplined execution — Reflect → Adjust → Improve.</footer></div><nav className="mobileNav">{tabs.filter(t=>mobileTabs.has(t.label)).map(t=><button key={t.label} className={`mobileNavBtn ${tab===t.label?"active":""}`} onClick={()=>setTab(t.label)}><span>{t.icon}</span><small>{t.label}</small></button>)}</nav></div>;
}
