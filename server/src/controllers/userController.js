import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Onboarding } from '../models/Onboarding.js';
import { FutureMeCard } from '../models/FutureMeCard.js';
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

  const { q, premium = 'all' } = parsed.data;
  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 20;

  const filter = {};

  // Never show admin accounts in the Users table.
  // Admins are managed separately and should not be impacted by bulk premium actions.
  filter.role = { $ne: 'admin' };

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

function serializeOnboarding(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    phoneNumber: o.phoneNumber || '',
    studentType: o.studentType || '',
    schoolClass: o.schoolClass || '',
    schoolStream: o.schoolStream || '',
    strongestAreas: o.strongestAreas || [],
    learningFormats: o.learningFormats || [],
    motivation: o.motivation || '',
    futureExcitement: o.futureExcitement || '',
    collegeYear: o.collegeYear || '',
    collegeDegree: o.collegeDegree || '',
    otherDegree: o.otherDegree || '',
    strengths: o.strengths || [],
    careerGoals: o.careerGoals || [],
    industries: o.industries || [],
    lifestyle: o.lifestyle || '',
    learningPreference: o.learningPreference || [],
    joiningReason: o.joiningReason || '',
    otherReason: o.otherReason || '',
    completedAt: o.completedAt || null,
  };
}

function serializeOnboardingAnswers(mapLike) {
  if (!mapLike) return null;
  if (mapLike instanceof Map) {
    const obj = {};
    for (const [k, v] of mapLike.entries()) obj[String(k)] = v;
    return obj;
  }
  if (typeof mapLike === 'object') return { ...mapLike };
  return null;
}

function serializeFutureMeCard(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    futureRole: o.futureRole || '',
    tagline: o.tagline || '',
    tags: o.tags || [],
    mindset: o.mindset || '',
    salary: o.salary || '',
    keySkills: o.keySkills || [],
    mentors: o.mentors || [],
    cta: o.cta || '',
    personalityType: o.personalityType || '',
    careerRecommendations: o.careerRecommendations || [],
    skillRecommendations: o.skillRecommendations || [],
    createdAt: o.createdAt || null,
  };
}

function serializeUserProfile(user, onboarding) {
  const scores = user.personalityScores || {};
  const createdAt = user.createdAt || objectIdTimestamp(user._id) || null;

  return {
    id: String(user._id),
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || onboarding?.phoneNumber || '',
    age: user.age ?? null,
    gender: user.gender || '',
    about: user.about || '',
    profilePic: user.profilePic || '',
    isPremium: Boolean(user.hasPlatformAccess),
    onboardingComplete: Boolean(user.onboardingComplete),
    purchasedCourses: Array.isArray(user.purchasedCourses) ? user.purchasedCourses : [],
    createdAt,
    lastLogin: user.lastLogin || null,
    socialLinks: (user.socialLinks || []).map((link) => ({
      platform: link?.platform || '',
      url: link?.url || '',
    })),
    experience: (user.experience || []).map((exp) => ({
      title: exp?.title || '',
      company: exp?.company || '',
      description: exp?.description || '',
      startDate: exp?.startDate || '',
      endDate: exp?.endDate || '',
      current: Boolean(exp?.current),
    })),
    skillsInProgress: (user.skillsInProgress || []).map((s) => ({
      name: s?.name || '',
      progress: typeof s?.progress === 'number' ? s.progress : null,
    })),
    completionCertificates: (user.completionCertificates || []).map((c) => ({
      name: c?.name || '',
      organization: c?.organization || '',
    })),
    personalityType: user.personalityType || '',
    personalityScores: {
      openness: scores.openness ?? 0,
      conscientiousness: scores.conscientiousness ?? 0,
      extraversion: scores.extraversion ?? 0,
      agreeableness: scores.agreeableness ?? 0,
      neuroticism: scores.neuroticism ?? 0,
    },
    careerRecommendations: user.careerRecommendations || [],
    skillRecommendations: user.skillRecommendations || [],
    activityLog: (user.activityLog || [])
      .slice()
      .sort((a, b) => new Date(b?.timestamp || 0) - new Date(a?.timestamp || 0))
      .slice(0, 25)
      .map((entry) => ({
        message: entry?.message || '',
        timestamp: entry?.timestamp || null,
      })),
  };
}

export const getUserDetail = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid user id');

  const user = await User.findById(id).lean();
  if (!user) throw new ApiError(404, 'User not found');
  if ((user.role || 'user') === 'admin') throw new ApiError(404, 'User not found');

  const userObjectId = new mongoose.Types.ObjectId(String(user._id));

  let onboarding = null;
  if (user.onboarding) {
    onboarding = await Onboarding.findById(user.onboarding).lean();
  }
  if (!onboarding) {
    onboarding = await Onboarding.findOne({ user: userObjectId })
      .sort({ completedAt: -1, _id: -1 })
      .lean();
  }
  // Fallback: raw collection read (same DB as prodigy-ai `onboardings`)
  if (!onboarding) {
    const raw = await mongoose.connection.db
      .collection('onboardings')
      .findOne({ user: userObjectId }, { sort: { completedAt: -1, _id: -1 } });
    if (raw) onboarding = raw;
  }

  let futureMeCard = null;
  if (user.futureMeCard) {
    futureMeCard = await FutureMeCard.findById(user.futureMeCard).lean();
  }
  if (!futureMeCard) {
    futureMeCard = await FutureMeCard.findOne({ user: userObjectId })
      .sort({ createdAt: -1, _id: -1 })
      .lean();
  }

  res.json({
    user: serializeUserProfile(user, onboarding),
    onboarding: serializeOnboarding(onboarding),
    onboardingAnswers: serializeOnboardingAnswers(user.onboardingAnswers),
    futureMeCard: serializeFutureMeCard(futureMeCard),
  });
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

