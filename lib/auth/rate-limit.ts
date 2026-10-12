const attempts = new Map<string, { count: number; resetAt: number }>();

export function consumeLoginAttempt(key: string, now = Date.now()) {
  const windowMs = 15 * 60 * 1000;
  const limit = 8;
  const existing = attempts.get(key);
  if (!existing || now >= existing.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (existing.count >= limit)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}
