import TradingOS from "@/components/trading-os";
import RightDock from "@/components/right-dock";
import LiveGoldPrice from "@/components/live-gold-price";
import AIAssistantOverlay from "@/components/ai-assistant-overlay";

export default function Page() {
  return (
    <>
      <TradingOS />
      <RightDock />
      <div style={{ position: "fixed", top: 20, right: 190, zIndex: 60 }}><LiveGoldPrice /></div>
      <AIAssistantOverlay />
    </>
  );
}
