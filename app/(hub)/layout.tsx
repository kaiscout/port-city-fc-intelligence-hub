import { HubShell } from "@/components/hub-shell";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth/guards";
import { canAccessPath } from "@/lib/auth/policies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const publicReadOnly = env.PUBLIC_DEMO_MODE === "true" || !env.DATABASE_URL;
  let viewer;
  if (!publicReadOnly) {
    try {
      viewer = await getSession();
    } catch {
      redirect("/login");
    }
    const path = (await headers()).get("x-pcfc-pathname") ?? "/dashboard";
    if (!canAccessPath(viewer.role, path)) redirect("/forbidden");
  }
  return (
    <HubShell
      publicReadOnly={publicReadOnly}
      viewer={viewer ? { role: viewer.role, displayName: viewer.displayName } : undefined}
    >
      {children}
    </HubShell>
  );
}
