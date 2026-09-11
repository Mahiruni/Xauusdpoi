# POI Trader OS

Standalone **Next.js + TypeScript** implementation of Mahir's XAUUSD POI trading operating system. It has no dependency on Lovable or any hosted website builder.

## Canonical strategy

Higher-Timeframe Bias → Key Level → Structure Shift → Valid Swing → Fibonacci → **0.71 POI** → Liquidity Sweep → Entry → **0.95 SL** → **0 TP1** → **−0.21 TP2**.

The app is built for market analysis, POI monitoring, discipline, journaling, backtesting, psychology review and alerts. It deliberately does **not** auto-execute broker trades.

## Included

- Premium responsive dark trading dashboard
- Weekly / Daily / H4 / H1 / M15 strategy context UI
- 0.71 POI, 0.95 SL, TP1 0, TP2 −0.21 visualization
- POI state machine and liquidity-sweep workflow
- Setup history
- Trading journal
- Psychology tracker
- Risk calculator
- Backtest dashboard and liquidity sweep statistics
- Strategy Lab with locked production rules + TEST ONLY variants
- Economic calendar placeholder
- Strategy-aware AI assistant demo
- Integration settings for market data, Supabase, browser push, Telegram and email
- Server API routes at `/api/health` and `/api/strategy`

## Important data note

The repository ships in **DEMO DATA** mode. Values shown in the UI are not live prices and are intentionally labeled as demo. Connect a verified server-side XAUUSD market-data provider before using live mode.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Production

```bash
npm run build
npm start
```

The project is deployable on Vercel or any host that supports Next.js.

## Production integrations to add

1. Realtime + historical XAUUSD candle provider
2. Server-side structure/POI monitor
3. Supabase/Postgres persistence with RLS
4. Economic calendar provider
5. Push / Telegram / email notification adapters
6. Background state-change worker so POI monitoring continues while the website is closed

## Security

- Keep provider and service keys server-side.
- Do not expose service-role keys in browser code.
- Keep `NEXT_PUBLIC_DEMO_MODE=true` until live data has been verified.
- No automated real-money broker execution is included.

**Built for disciplined execution — Reflect → Adjust → Improve.**
