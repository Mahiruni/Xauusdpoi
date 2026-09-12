"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; title?: string };
type State = { hasError: boolean; message: string };

export default class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected client error",
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Trader OS client error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="border-y border-black/[0.06] bg-[#f4f4f6] px-5 py-16 text-[#17181b]">
        <div className="mx-auto max-w-[900px] rounded-[24px] border border-black/[0.07] bg-white p-7 shadow-[0_18px_50px_rgba(25,30,40,.07)]">
          <div className="text-[9px] font-extrabold tracking-[0.18em] text-[#9b9fa6]">RECOVERABLE CLIENT ERROR</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{this.props.title ?? "This workspace section could not render."}</h2>
          <p className="mt-2 text-sm text-[#777b83]">The rest of the application remains available. Refreshing will retry the failed section.</p>
          <code className="mt-4 block overflow-auto rounded-xl bg-[#f4f4f6] p-3 text-xs text-[#555b66]">{this.state.message}</code>
          <button onClick={() => window.location.reload()} className="mt-5 rounded-full bg-[#17181b] px-4 py-2 text-xs font-semibold text-white">Reload workspace</button>
        </div>
      </section>
    );
  }
}
