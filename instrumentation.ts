export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { requireProductionEnv } = await import("./lib/env");
    requireProductionEnv();
  }
}
