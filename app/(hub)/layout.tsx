import { HubShell } from "@/components/hub-shell";
import { env } from "@/lib/env";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const publicReadOnly = env.PUBLIC_DEMO_MODE === "true" || !env.DATABASE_URL;
  return <HubShell publicReadOnly={publicReadOnly}>{children}</HubShell>;
}
