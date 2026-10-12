type Level = "debug" | "info" | "warn" | "error";

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        /password|secret|token|cookie|authorization/i.test(key) ? key : key,
        /password|secret|token|cookie|authorization/i.test(key) ? "[REDACTED]" : redact(item),
      ]),
    );
  return value;
};

export function log(level: Level, event: string, context: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(redact(context) as Record<string, unknown>),
  };
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}
