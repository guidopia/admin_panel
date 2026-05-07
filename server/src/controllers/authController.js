import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { User } from '../models/User.js';
import { getEnv } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Invalid input', parsed.error.flatten());

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '_id name email password role isPremium createdAt'
  );

  if (!user) throw new ApiError(401, 'Invalid email or password');
  if ((user.role || 'user') !== 'admin') throw new ApiError(403, 'Admin access required');

  const hash = user.password || '';
  const ok = hash ? await bcrypt.compare(password, hash) : false;
  if (!ok) throw new ApiError(401, 'Invalid email or password');

  const env = getEnv();
  if (!env.jwtSecret) throw new ApiError(500, 'Missing JWT_SECRET');

  const token = jwt.sign(
    {
      sub: String(user._id),
      role: user.role || 'admin',
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  res.json({
    token,
    user: {
      id: String(user._id),
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'admin',
      isPremium: Boolean(user.isPremium),
    },
  });
});

