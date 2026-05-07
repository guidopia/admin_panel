import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  if (!token) throw new ApiError(401, 'Unauthorized');
  const env = getEnv();
  if (!env.jwtSecret) throw new ApiError(500, 'Missing JWT_SECRET');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid token');
  }

  const user = await User.findById(decoded.sub).select('_id name email role isPremium createdAt');
  if (!user) throw new ApiError(401, 'Unauthorized');

  req.user = {
    id: String(user._id),
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user',
    isPremium: Boolean(user.isPremium),
  };

  next();
});

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(new ApiError(401, 'Unauthorized'));
  if (req.user.role !== 'admin') return next(new ApiError(403, 'Admin access required'));
  return next();
}

