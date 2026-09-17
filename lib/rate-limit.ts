// In-memory sliding window rate limiter for API endpoints
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Checks rate limit for a given key (IP, user ID, or endpoint key)
 * @param key Unique key identifying the requester
 * @param maxHits Maximum requests allowed per window
 * @param windowMs Window duration in milliseconds (default 60 seconds)
 */
export function checkRateLimit(
  key: string,
  maxHits: number = 20,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxHits - 1, resetInMs: windowMs };
  }

  if (record.count >= maxHits) {
    return { allowed: false, remaining: 0, resetInMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, remaining: maxHits - record.count, resetInMs: record.resetAt - now };
}
