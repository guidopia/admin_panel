import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Onboarding } from '../models/Onboarding.js';
import { FutureMeCard } from '../models/FutureMeCard.js';
import { ApiError } from '../utils/apiError.js';

function objectIdTimestamp(id) {
  try {
    return new mongoose.Types.ObjectId(id).getTimestamp();
  } catch {
    return null;
  }
}

export function serializeOnboarding(doc) {
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

export function serializeOnboardingAnswers(mapLike) {
  if (!mapLike) return null;
  if (mapLike instanceof Map) {
    const obj = {};
    for (const [k, v] of mapLike.entries()) obj[String(k)] = v;
    return obj;
  }
  if (typeof mapLike === 'object') return { ...mapLike };
  return null;
}

export function serializeFutureMeCard(doc) {
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

export function serializeUserProfile(user, onboarding, { fullActivityLog = false } = {}) {
  const scores = user.personalityScores || {};
  const createdAt = user.createdAt || objectIdTimestamp(user._id) || null;

  const activityLog = (user.activityLog || [])
    .slice()
    .sort((a, b) => new Date(b?.timestamp || 0) - new Date(a?.timestamp || 0))
    .map((entry) => ({
      message: entry?.message || '',
      timestamp: entry?.timestamp || null,
    }));

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
    activityLog: fullActivityLog ? activityLog : activityLog.slice(0, 25),
  };
}

async function loadOnboardingForUser(user) {
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
  if (!onboarding && mongoose.connection?.db) {
    onboarding = await mongoose.connection.db
      .collection('onboardings')
      .findOne({ user: userObjectId }, { sort: { completedAt: -1, _id: -1 } });
  }
  return onboarding;
}

async function loadFutureMeForUser(user) {
  const userObjectId = new mongoose.Types.ObjectId(String(user._id));

  let futureMeCard = null;
  if (user.futureMeCard) {
    futureMeCard = await FutureMeCard.findById(user.futureMeCard).lean();
  }
  if (!futureMeCard) {
    futureMeCard = await FutureMeCard.findOne({ user: userObjectId })
      .sort({ createdAt: -1, _id: -1 })
      .lean();
  }
  return futureMeCard;
}

export async function fetchUserBundleById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid user id');

  const user = await User.findById(id).lean();
  if (!user) throw new ApiError(404, 'User not found');
  if ((user.role || 'user') === 'admin') throw new ApiError(404, 'User not found');

  const onboarding = await loadOnboardingForUser(user);
  const futureMeCard = await loadFutureMeForUser(user);

  return {
    user: serializeUserProfile(user, onboarding, { fullActivityLog: true }),
    onboarding: serializeOnboarding(onboarding),
    onboardingAnswers: serializeOnboardingAnswers(user.onboardingAnswers),
    futureMeCard: serializeFutureMeCard(futureMeCard),
  };
}

export async function fetchAllUserBundles() {
  const users = await User.find({ role: { $ne: 'admin' } })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  const userIds = users.map((u) => u._id);

  const [onboardings, futureMeCards] = await Promise.all([
    Onboarding.find({ user: { $in: userIds } }).lean(),
    FutureMeCard.find({ user: { $in: userIds } }).lean(),
  ]);

  const onboardingByUser = new Map();
  for (const o of onboardings) {
    const key = String(o.user);
    const prev = onboardingByUser.get(key);
    if (!prev || new Date(o.completedAt || 0) > new Date(prev.completedAt || 0)) {
      onboardingByUser.set(key, o);
    }
  }

  const futureMeByUser = new Map();
  for (const f of futureMeCards) {
    const key = String(f.user);
    const prev = futureMeByUser.get(key);
    if (!prev || new Date(f.createdAt || 0) > new Date(prev.createdAt || 0)) {
      futureMeByUser.set(key, f);
    }
  }

  return users.map((user) => {
    const uid = String(user._id);
    const onboarding = onboardingByUser.get(uid) || null;
    const futureMeCard = futureMeByUser.get(uid) || null;
    return {
      user: serializeUserProfile(user, onboarding, { fullActivityLog: true }),
      onboarding: serializeOnboarding(onboarding),
      onboardingAnswers: serializeOnboardingAnswers(user.onboardingAnswers),
      futureMeCard: serializeFutureMeCard(futureMeCard),
    };
  });
}
