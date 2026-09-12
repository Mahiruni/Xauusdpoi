import AppleTraderOS from "@/components/apple-trader-os";
import LiveFinancialChart from "@/components/live-financial-chart";

export default function Page() {
  return (
    <>
      <AppleTraderOS />
      <section className="border-t border-black/[0.06] bg-[#f4f4f6] px-3 py-10 text-[#17181b] sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1260px]">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-[8px] font-extrabold tracking-[0.16em] text-[#9b9fa6]">MARKET VISUALIZATION</span>
              <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.045em]">Live XAU/USD chart</h2>
              <p className="mt-1 text-[10px] text-[#777b83]">Provider candles with the exact live quote synchronized to the latest bar.</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-black/[0.07] bg-white/75 px-3 py-2 text-[8px] font-bold tracking-[0.08em] text-[#7f838a]">TWELVE DATA · NO SYNTHETIC PRICE</span>
          </div>
          <div className="overflow-hidden rounded-[22px] border border-black/[0.07] bg-white/80 shadow-[0_18px_50px_rgba(25,30,40,.07)] backdrop-blur-xl">
            <LiveFinancialChart symbol="XAU/USD" timeframe="15m" height={700} />
          </div>
        </div>
      </section>
    </>
  );
}
