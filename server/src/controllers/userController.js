import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function objectIdTimestamp(id) {
  try {
    return new mongoose.Types.ObjectId(id).getTimestamp();
  } catch {
    return null;
  }
}

const listUsersQuerySchema = z.object({
  q: z.string().optional(),
  premium: z.enum(['true', 'false', 'all']).optional(),
  role: z.enum(['admin', 'user', 'all']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const listUsers = asyncHandler(async (req, res) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Invalid query', parsed.error.flatten());

  const { q, premium = 'all', role = 'all' } = parsed.data;
  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 20;

  const filter = {};

  if (q?.trim()) {
    const s = q.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }
  // Canonical premium flag for the main platform is `hasPlatformAccess`.
  // Keep `isPremium` in sync on writes, but filter by `hasPlatformAccess` so admin actions
  // immediately affect the user-facing app (`prodigy-ai`).
  if (premium !== 'all') filter.hasPlatformAccess = premium === 'true';
  if (role !== 'all') filter.role = role;

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('_id name email isPremium hasPlatformAccess role createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const users = docs.map((u) => {
    const createdAt = u.createdAt || objectIdTimestamp(u._id) || null;
    const hasPlatformAccess = Boolean(u.hasPlatformAccess);
    return {
      id: String(u._id),
      name: u.name || '',
      email: u.email || '',
      // Expose as `isPremium` to keep the existing admin UI unchanged,
      // but back it by the platform access flag.
      isPremium: hasPlatformAccess,
      role: u.role || 'user',
      createdAt,
    };
  });

  res.json({
    users,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

const premiumBodySchema = z.object({
  isPremium: z.boolean(),
});

export const setUserPremium = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid user id');

  const parsed = premiumBodySchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Invalid input', parsed.error.flatten());

  const next = parsed.data.isPremium;
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { isPremium: next, hasPlatformAccess: next } },
    { new: true, runValidators: true }
  ).select('_id name email isPremium hasPlatformAccess role createdAt');

  if (!user) throw new ApiError(404, 'User not found');

  res.json({
    user: {
      id: String(user._id),
      name: user.name || '',
      email: user.email || '',
      isPremium: Boolean(user.hasPlatformAccess),
      role: user.role || 'user',
      createdAt: user.createdAt || objectIdTimestamp(user._id) || null,
    },
  });
});

const bulkSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(500),
  isPremium: z.boolean(),
});

export const bulkSetPremium = asyncHandler(async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Invalid input', parsed.error.flatten());

  const ids = parsed.data.userIds;
  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== ids.length) throw new ApiError(400, 'One or more userIds are invalid');

  const next = parsed.data.isPremium;
  const result = await User.updateMany(
    { _id: { $in: validIds } },
    { $set: { isPremium: next, hasPlatformAccess: next } }
  );

  res.json({
    matched: result.matchedCount ?? result.n ?? 0,
    modified: result.modifiedCount ?? result.nModified ?? 0,
    isPremium: next,
  });
});

