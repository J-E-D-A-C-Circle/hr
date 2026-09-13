type RateLimitData = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitData>();

/**
 * A simple in-memory rate limiter.
 * @param identifier - A unique string for the client (e.g., IP address or phone number)
 * @param limit - Maximum number of requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns boolean - True if the request is allowed, false if rate limited
 */
export function rateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record) {
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (now > record.resetTime) {
    // Window expired, reset
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  record.count += 1;
  store.set(identifier, record);
  return true;
}

// Optional cleanup interval to prevent memory leaks in long-running processes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now > data.resetTime) {
      store.delete(key);
    }
  }
}, 60 * 1000).unref(); // unref ensures this doesn't prevent the Node process from exiting
