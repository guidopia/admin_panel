import { ApiError } from '../utils/apiError.js';

function isProductionLike() {
  return Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
}

/**
 * Shared-secret guard for server-to-server Access Control endpoints
 * (referral validate, student register, student lookup).
 *
 * Production / Vercel: INTERNAL_REGISTER_KEY must be set and match `x-internal-key`.
 * Local/dev: if the key is unset, the guard is a no-op for convenience.
 */
export function requireInternalKey(req, _res, next) {
  const expected = (process.env.INTERNAL_REGISTER_KEY || '').trim();

  if (!expected) {
    if (isProductionLike()) {
      return next(
        new ApiError(500, 'INTERNAL_REGISTER_KEY is required in production')
      );
    }
    return next();
  }

  const provided = (req.headers['x-internal-key'] || '').toString().trim();
  if (!provided || provided !== expected) {
    return next(new ApiError(401, 'Invalid internal key'));
  }
  return next();
}
