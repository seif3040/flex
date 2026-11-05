import { afterEach, describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimitsForTests } from '@/lib/security/rate-limit';

describe('in-memory rate limiter', () => {
  afterEach(() => resetRateLimitsForTests());

  it('allows up to the configured limit and rejects the next request', () => {
    expect(checkRateLimit('user:1', 2, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit('user:1', 2, 60_000, 2_000).allowed).toBe(true);
    const rejected = checkRateLimit('user:1', 2, 60_000, 3_000);
    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('expires requests outside the rolling window', () => {
    expect(checkRateLimit('user:2', 1, 1_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit('user:2', 1, 1_000, 2_001).allowed).toBe(true);
  });
});
