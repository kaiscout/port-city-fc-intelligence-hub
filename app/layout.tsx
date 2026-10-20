import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "../site/lab.css";

export const metadata: Metadata = {
  title: {
    default: "Port City FC Business Intelligence & Analytics",
    template: "%s · PCFC BI & Analytics",
  },
  description:
    "Independent Port City FC business intelligence and analytics case study. Public demonstration uses synthetic and generalized data.",
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
