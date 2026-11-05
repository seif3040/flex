type Bucket = number[];

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const cutoff = now - windowMs;
  const recent = (buckets.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimitsForTests() { buckets.clear(); }
