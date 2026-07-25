import { ApiError } from '../utils/apiError.js';

/**
 * Optional shared-secret guard for server-to-server endpoints.
 *
 * Student self-registration is inherently public (a brand-new student has no
 * JWT yet). When the integrated student website performs registration
 * server-to-server, we can lock the endpoint down: if `INTERNAL_REGISTER_KEY`
 * is configured, callers must send a matching `x-internal-key` header.
 *
 * If the env var is not set, the guard is a no-op so the endpoint keeps its
 * original public behavior (backward compatible).
 */
export function requireInternalKey(req, _res, next) {
  const expected = (process.env.INTERNAL_REGISTER_KEY || '').trim();
  if (!expected) return next();

  const provided = (req.headers['x-internal-key'] || '').toString().trim();
  if (!provided || provided !== expected) {
    return next(new ApiError(401, 'Invalid internal key'));
  }
  return next();
}
