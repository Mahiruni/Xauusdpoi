export const STRATEGY = {
  symbol: "XAUUSD",
  poi: 0.71,
  stop: 0.95,
  tp1: 0,
  tp2: -0.21,
  sequence: [
    "HTF Bias",
    "Key Level",
    "Structure Shift",
    "Valid Swing",
    "Fibonacci",
    "0.71 POI",
    "Liquidity Sweep",
    "Entry",
    "0.95 SL",
    "0 TP1",
    "−0.21 TP2",
  ],
} as const;

export type SetupState = "VALID" | "DEVELOPING" | "WAIT" | "INVALID";

export const DEMO_SETUP = {
  mode: "DEMO" as const,
  symbol: "XAUUSD" as const,
  direction: "BEARISH" as const,
  weeklyBias: "Bearish",
  dailyBias: "Bearish",
  h4: "Bearish",
  h1: "External bearish shift confirmed",
  m15: "Retracing into POI",
  swingHigh: 3672.4,
  swingLow: 3622.1,
  currentPrice: 3656.9,
  stateIndex: 6,
  liquiditySweeps: 0,
};

export const SETUP_STAGES = [
  "HTF bias",
  "Structure shift",
  "Valid impulse",
  "Wait retracement",
  "Approaching POI",
  "Inside POI",
  "Wait liquidity",
  "Liquidity swept",
  "Setup confirmed",
  "Active",
  "Outcome",
] as const;

export function fibPrice(level: number) {
  const range = DEMO_SETUP.swingHigh - DEMO_SETUP.swingLow;
  return DEMO_SETUP.swingLow + range * level;
}

export function setupState(): SetupState {
  if (DEMO_SETUP.stateIndex >= 8) return "VALID";
  if (DEMO_SETUP.stateIndex >= 4) return "DEVELOPING";
  return "WAIT";
}

export function setupReason() {
  if (DEMO_SETUP.stateIndex < 4) return "The higher-timeframe or structural conditions are incomplete.";
  if (DEMO_SETUP.stateIndex < 7) return "HTF direction and the impulse are aligned, but the required internal liquidity sweep has not occurred yet.";
  if (DEMO_SETUP.stateIndex < 8) return "Liquidity has been swept. Wait for the strategy-defined reaction confirmation.";
  return "Structure, POI and liquidity conditions are satisfied. Risk and execution rules still apply.";
}

export function fmt(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
