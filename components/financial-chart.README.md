# FinancialChart

`FinancialChart` is a client-side, TradingView-style market chart built for the POI Trader OS. It uses Lightweight Charts 4.2.3, Zustand, Framer Motion, TypeScript and Tailwind CSS.

## Drop-in usage

```tsx
import FinancialChart from "@/components/financial-chart";

export default function Page() {
  return <FinancialChart symbol="XAU/USD" initialTimeframe="15m" />;
}
```

The component accepts normalized candles:

```ts
interface ChartCandle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

## Historical REST

By default the component calls `/api/chart?symbol=XAU/USD&timeframe=15m&limit=2500`. The included route proxies Twelve Data server-side so the API key never reaches the browser. Supported timeframes are 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1D, 1W and 1M.

Set `TWELVE_DATA_API_KEY` in the server environment. `MARKET_DATA_API_KEY` is accepted as a fallback for compatibility with the existing POI Trader OS market route.

## WebSocket

The component accepts either an already-managed WebSocket or a WebSocket URL. Incoming frames should normalize to:

```json
{"time":1726200000,"open":4300,"high":4304,"low":4298,"close":4302,"volume":1200}
```

Example:

```tsx
<FinancialChart
  symbol="BTC/USDT"
  websocketUrl="wss://your-feed.example/ws"
/>
```

For Binance/Bybit, put provider-specific parsing in a small adapter and emit the normalized `ChartRealtimeMessage` shape. The chart deduplicates timestamps, replaces an existing candle when the same timestamp arrives, inserts out-of-order candles into sorted position, and caps in-memory history at 10,000 candles.

## Included UX

- Candles, hollow candles, Heikin Ashi, line, area, bars and baseline.
- All requested timeframe buttons.
- SMA, EMA, WMA, Bollinger, RSI, MACD, VWAP, Stochastic, ATR and basic Volume Profile state hooks.
- Magnet crosshair, percentage scale, auto scale, left/right scales, responsive resize, wheel zoom, drag pan and touch gestures.
- Local drawing persistence by symbol.
- Trend, horizontal, vertical, ray, Fibonacci, rectangle and text drawings.
- Right-click menu and keyboard shortcuts: `F`, `H`, `T`, `V`, `Delete`, `Escape`.
- Loading, error and empty states.
- Framer Motion transitions and a mobile-first toolbar.

## Production notes

Keep provider credentials server-side. For high-frequency feeds, aggregate messages into candle updates before passing them to React so the browser does not re-render for every tick. The chart itself uses Lightweight Charts' imperative API and only updates the series when normalized data changes.

The drawing layer is intentionally independent from the chart series, which makes it straightforward to replace with a richer persistence/backend layer later.
