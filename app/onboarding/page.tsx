import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { env } from "@/lib/env";
export default async function OnboardingPage() {
  if (env.PUBLIC_DEMO_MODE !== "true" && env.DATABASE_URL) {
    try {
      await requirePermission("settings:write");
    } catch (error) {
      redirect(error instanceof Error && error.message === "FORBIDDEN" ? "/forbidden" : "/login");
    }
  }
  redirect("/settings");
}
