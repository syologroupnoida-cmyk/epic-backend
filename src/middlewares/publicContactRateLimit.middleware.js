import { ApiError } from '../utils/ApiError.js';

// Lightweight protection for a public form. For multi-instance production
// deployments, replace this memory store with Redis or an edge/WAF limit.
const submissions = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

export const limitPublicContactSubmissions = (req, _res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  const recent = (submissions.get(key) || []).filter((timestamp) => timestamp > now - WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    return next(ApiError.tooManyRequests('Too many Contact Us submissions. Please try again later.'));
  }
  recent.push(now);
  submissions.set(key, recent);
  return next();
};
