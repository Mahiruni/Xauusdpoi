import { DEMO_SETUP, STRATEGY, setupReason, setupState } from "@/lib/strategy";

export async function GET() {
  return Response.json({
    demo: true,
    strategy: STRATEGY,
    setup: DEMO_SETUP,
    state: setupState(),
    reason: setupReason(),
    warning: "Demo market state only. Connect a verified server-side data provider before live use.",
  });
}
