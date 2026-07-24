import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { getEnv } from '../config/env.js';
import { AccessUser } from '../models/AccessUser.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { serializeAccessUser } from '../utils/serializers.js';
import { accessLoginSchema, parseOrThrow } from '../validators/accessValidators.js';

export const accessLogin = asyncHandler(async (req, res) => {
  const { email, password } = parseOrThrow(accessLoginSchema, req.body, ApiError);

  const user = await AccessUser.findOne({ email: email.toLowerCase().trim() }).select(
    '+password _id name email accessRole organizationId counselorId status'
  );

  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (user.status !== 'active') throw new ApiError(403, 'Account is inactive');

  const ok = await bcrypt.compare(password, user.password || '');
  if (!ok) throw new ApiError(401, 'Invalid email or password');

  const env = getEnv();
  if (!env.jwtSecret) throw new ApiError(500, 'Missing JWT_SECRET');

  const token = jwt.sign(
    {
      sub: String(user._id),
      typ: 'access',
      accessRole: user.accessRole,
      organizationId: user.organizationId ? String(user.organizationId) : null,
      counselorId: user.counselorId ? String(user.counselorId) : null,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  res.json({
    token,
    user: serializeAccessUser(user),
  });
});

export const accessMe = asyncHandler(async (req, res) => {
  res.json({ user: req.accessUser });
});
