import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Port City FC Decision Intelligence Hub", template: "%s · PCFC Hub" },
  description:
    "Independent portfolio case study: an operational decision-intelligence pilot for Port City FC.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Reading request headers opts the shell into dynamic rendering. Next.js can then
  // propagate the per-request CSP nonce from proxy.ts to its bootstrap scripts.
  await headers();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
