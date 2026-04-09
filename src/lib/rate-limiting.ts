/**
 * Rate limiting — simple in-memory implementation.
 *
 * For a private family app this is perfectly sufficient.
 * Note: resets on server restart, and doesn't share state across
 * multiple server instances. Both are fine for a single-instance deployment.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
    success:   boolean;
    remaining: number;
    reset:     number; // unix ms
  }
  
  // ─── In-memory limiter ────────────────────────────────────────────────────────
  
  type MemoryEntry = { count: number; reset: number };
  
  function createLimiter(maxRequests: number, windowMs: number) {
    const store = new Map<string, MemoryEntry>();
  
    // Prune stale entries to prevent memory growth on long-running servers
    setInterval(() => {
      const now = Date.now();
      store.forEach((v, k) => { if (v.reset < now) store.delete(k); });
    }, windowMs);
  
    return function limit(key: string): RateLimitResult {
      const now   = Date.now();
      const entry = store.get(key);
  
      if (!entry || entry.reset < now) {
        store.set(key, { count: 1, reset: now + windowMs });
        return { success: true, remaining: maxRequests - 1, reset: now + windowMs };
      }
  
      entry.count += 1;
      return {
        success:   entry.count <= maxRequests,
        remaining: Math.max(0, maxRequests - entry.count),
        reset:     entry.reset,
      };
    };
  }
  
  // ─── Limiters ─────────────────────────────────────────────────────────────────
  
  // 5 login attempts per 15 minutes per IP
  const loginLimit = createLimiter(5, 15 * 60 * 1000);
  
  // 5 registrations per hour per IP
  const registerLimit = createLimiter(5, 60 * 60 * 1000);
  
  // 3 password reset requests per hour per IP
  const forgotPasswordLimit = createLimiter(3, 60 * 60 * 1000);
  
  // ─── Public helpers ───────────────────────────────────────────────────────────
  
  /** Extract client IP from a Next.js Request */
  export function getClientIp(request: Request): string {
    return (
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous"
    );
  }
  
  export function checkLoginRateLimit(ip: string): RateLimitResult {
    return loginLimit(`login:${ip}`);
  }
  
  export function checkRegisterRateLimit(ip: string): RateLimitResult {
    return registerLimit(`register:${ip}`);
  }
  
  export function checkForgotPasswordRateLimit(ip: string): RateLimitResult {
    return forgotPasswordLimit(`forgot:${ip}`);
  }