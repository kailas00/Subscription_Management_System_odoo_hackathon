// Small in-memory rate limiter (no extra dependency). Good for a single server instance;
// use a shared store (e.g. Redis) if the API ever runs on several machines.
import { ApiError } from './errors.js';

const buckets = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
}, 60_000).unref();

/**
 * rateLimit({ windowMs, max, key: (req) => string })
 * Responds 429 with Retry-After when exceeded.
 */
export const rateLimit = ({ windowMs, max, key = (req) => req.ip, message = 'Too many attempts. Please wait a few minutes and try again.' }) =>
  (req, res, next) => {
    const k = `${req.baseUrl}${req.path}:${key(req)}`;
    const now = Date.now();
    const b = buckets.get(k) ?? { count: 0, reset: now + windowMs };
    if (b.reset <= now) { b.count = 0; b.reset = now + windowMs; }
    b.count += 1;
    buckets.set(k, b);
    if (b.count > max) {
      res.set('Retry-After', String(Math.ceil((b.reset - now) / 1000)));
      return next(new ApiError(429, 'RATE_LIMITED', message));
    }
    next();
  };

/** Limit per client IP and, when present, per email (stops spraying one account from many IPs). */
export const byIpAndEmail = (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase()}`;
