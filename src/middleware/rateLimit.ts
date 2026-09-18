import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for the login endpoint to slow brute-force attempts.
 *
 * Uses the default in-memory store. On serverless this is per-instance
 * (best-effort) rather than global — acceptable for the MVP's single-admin
 * login; a shared store (Redis/DB) can be swapped in later without touching
 * call sites.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again in a few minutes.',
});
