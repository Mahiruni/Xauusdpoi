"use client";

import { useEffect, useState } from "react";

type Market = { live?: boolean; price?: number | null; changePct?: number | null; updatedAt?: string | null; candles?: unknown[] };
type Message = { role: "user" | "ai"; text: string };

const starters = ["What is XAU/USD doing right now?", "Has my 0.71 POI been reached?", "What conditions are still missing?", "Explain my current setup."];

export default function AIAssistantOverlay() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [market, setMarket] = useState<Market>({});
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "I’m connected to the POI Trader OS. Ask me about the verified market feed or your 0.71 POI framework. I will say UNKNOWN when the data cannot support a conclusion." }
  ]);

  useEffect(() => {
    const load = async () => { try { const r = await fetch("/api/market", { cache: "no-store" }); setMarket(await r.json()); } catch {} };
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  async function ask(text = question) {
    const q = text.trim();
    if (!q || loading) return;
    setQuestion("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, market }) });
      const data = await r.json();
      setMessages(m => [...m, { role: "ai", text: data.answer || data.error || "UNKNOWN — no response." }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "UNKNOWN — the assistant service could not be reached." }]);
    } finally { setLoading(false); }
  }

  return <>
    <button className="aiLauncher" onClick={() => setOpen(v => !v)} aria-label="Open AI assistant"><span>✦</span><b>AI</b></button>
    {open ? <aside className="aiPanel">
      <div className="aiHead"><div><div className="aiEyebrow">TRADING INTELLIGENCE</div><h2>POI Assistant</h2></div><button className="aiClose" onClick={() => setOpen(false)}>×</button></div>
      <div className="aiMarket"><span><i /> XAU/USD</span><strong>{Number.isFinite(Number(market.price)) ? `$${Number(market.price).toFixed(2)}` : "—"}</strong><small>{market.live ? "LIVE FEED" : "FEED NOT VERIFIED"}</small></div>
      <div className="aiMessages">{messages.map((m,i)=><div className={`aiBubble ${m.role}`} key={i}>{m.text}</div>)}{loading ? <div className="aiBubble ai"><span className="typing">Analyzing verified context…</span></div> : null}</div>
      <div className="aiStarters">{starters.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>
      <form className="aiForm" onSubmit={e => { e.preventDefault(); ask(); }}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about XAU/USD…"/><button disabled={loading || !question.trim()}>↑</button></form>
      <div className="aiNote">Strategy-aware • No invented data • No unconditional trade commands</div>
      <style jsx>{`
        .aiLauncher{position:fixed;right:24px;bottom:24px;z-index:80;width:58px;height:58px;border-radius:18px;border:1px solid rgba(49,87,213,.22);background:linear-gradient(145deg,#3157d5,#2446b7);color:white;box-shadow:0 18px 45px rgba(49,87,213,.28);display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:.2s}.aiLauncher:hover{transform:translateY(-2px)}.aiLauncher span{font-size:18px}.aiLauncher b{font-size:10px;letter-spacing:.08em}
        .aiPanel{position:fixed;right:24px;bottom:94px;z-index:79;width:min(410px,calc(100vw - 32px));height:min(680px,calc(100vh - 125px));display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(49,87,213,.18);border-radius:24px;background:rgba(250,252,255,.91);backdrop-filter:blur(28px);box-shadow:0 28px 80px rgba(27,43,74,.20);color:#17233d}
        .aiHead{padding:18px 18px 14px;display:flex;justify-content:space-between;border-bottom:1px solid rgba(32,48,78,.08)}.aiEyebrow{font-size:8px;letter-spacing:.16em;font-weight:900;color:#3157d5}.aiHead h2{margin:5px 0 0;font-size:19px;letter-spacing:-.04em}.aiClose{border:0;background:transparent;font-size:24px;color:#748097;cursor:pointer}
        .aiMarket{margin:14px;padding:12px 13px;border:1px solid rgba(32,48,78,.08);border-radius:15px;background:rgba(255,255,255,.7);display:grid;grid-template-columns:1fr auto;gap:3px 10px}.aiMarket span{font-size:10px;font-weight:800;color:#66728a}.aiMarket i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#20a66a;margin-right:5px}.aiMarket strong{grid-row:1/3;align-self:center;font-size:18px}.aiMarket small{font-size:8px;color:#3157d5;font-weight:800;letter-spacing:.08em}
        .aiMessages{flex:1;overflow:auto;padding:2px 14px 10px}.aiBubble{max-width:88%;padding:11px 12px;margin:7px 0;border-radius:15px;font-size:12px;line-height:1.55;white-space:pre-wrap}.aiBubble.ai{background:white;border:1px solid rgba(32,48,78,.08)}.aiBubble.user{margin-left:auto;background:#3157d5;color:white}.typing{opacity:.7}
        .aiStarters{display:flex;gap:6px;overflow:auto;padding:5px 14px 9px}.aiStarters button{flex:0 0 auto;border:1px solid rgba(49,87,213,.13);background:rgba(49,87,213,.055);color:#3157d5;border-radius:999px;padding:7px 9px;font-size:9px;cursor:pointer}
        .aiForm{display:flex;gap:7px;padding:10px 14px;border-top:1px solid rgba(32,48,78,.08)}.aiForm input{min-width:0;flex:1;border:1px solid rgba(32,48,78,.11);border-radius:13px;background:white;padding:11px 12px;outline:none;font-size:12px}.aiForm input:focus{border-color:rgba(49,87,213,.4);box-shadow:0 0 0 3px rgba(49,87,213,.07)}.aiForm button{width:40px;border:0;border-radius:12px;background:#3157d5;color:white;font-size:17px;cursor:pointer}.aiForm button:disabled{opacity:.45}.aiNote{text-align:center;padding:0 12px 12px;font-size:8px;color:#8791a5}
        @media(max-width:700px){.aiLauncher{right:16px;bottom:72px}.aiPanel{right:8px;bottom:132px;width:calc(100vw - 16px);height:calc(100vh - 155px)}}
      `}</style>
    </aside> : null}
  </>;
}
