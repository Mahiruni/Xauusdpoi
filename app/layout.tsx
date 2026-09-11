import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POI Trader OS",
  description: "XAUUSD market-structure, Fibonacci POI, liquidity, journaling and discipline operating system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
