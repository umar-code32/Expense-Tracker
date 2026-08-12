// Simple in-memory sliding-window rate limiter. Good enough for a single-process
// deployment; state is per-process and resets on restart, so it won't scale to
// multiple server instances without moving to a shared store (e.g. Redis).
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now >= entry.resetAt) {
    if (attempts.size > 5000) {
      for (const [k, v] of attempts) {
        if (now >= v.resetAt) attempts.delete(k);
      }
    }
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
