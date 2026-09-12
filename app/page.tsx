import AppleTraderOS from "@/components/apple-trader-os";
import LiveFinancialChart from "@/components/live-financial-chart";

export default function Page() {
  return (
    <>
      <AppleTraderOS />
      <section className="at-chart-section">
        <div className="at-chart-head">
          <div>
            <span>MARKET VISUALIZATION</span>
            <h2>Live XAU/USD chart</h2>
            <p>Provider candles with the exact live quote synchronized to the latest bar.</p>
          </div>
          <span className="at-chart-note">Twelve Data · no synthetic price</span>
        </div>
        <LiveFinancialChart symbol="XAU/USD" timeframe="15m" height={700} />
      </section>
    </>
  );
}
