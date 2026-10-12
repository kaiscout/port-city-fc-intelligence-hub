import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  APP_URL: z.string().url().default("http://127.0.0.1:3000"),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
  PUBLIC_DEMO_MODE: z.enum(["true", "false"]).default("false"),
  LOCAL_PREVIEW_MODE: z.enum(["true", "false"]).default("false"),
  PORTFOLIO_DISCLAIMER: z.enum(["true", "false"]).default("true"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  DEMO_MODE: process.env.DEMO_MODE,
  PUBLIC_DEMO_MODE: process.env.PUBLIC_DEMO_MODE,
  LOCAL_PREVIEW_MODE: process.env.LOCAL_PREVIEW_MODE,
  PORTFOLIO_DISCLAIMER: process.env.PORTFOLIO_DISCLAIMER,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

export function requireProductionEnv() {
  if (process.env.NODE_ENV === "production") {
    if (env.PUBLIC_DEMO_MODE === "true") {
      if (env.DATABASE_URL) throw new Error("PUBLIC_DEMO_MODE must not be connected to a database");
      return;
    }
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required in production");
    if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET is required in production");
    if (env.DEMO_MODE === "true" && env.LOCAL_PREVIEW_MODE !== "true")
      throw new Error("DEMO_MODE must be false in production");
    if (env.LOCAL_PREVIEW_MODE === "true") {
      const hostname = new URL(env.APP_URL).hostname;
      if (hostname !== "127.0.0.1" && hostname !== "localhost")
        throw new Error("LOCAL_PREVIEW_MODE requires a loopback APP_URL");
    }
  }
}
