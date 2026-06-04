import mongoose from 'mongoose';

export const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, default: '' },
    isPremium: { type: Boolean, default: false, index: true },
    // Canonical premium flag for the main platform (`prodigy-ai`) is `hasPlatformAccess`.
    // Keep it on this shared `users` collection so the admin panel can control access platform-wide.
    hasPlatformAccess: { type: Boolean, default: false, index: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    minimize: false,
    strict: false,
  }
);

// prodigy-ai user fields used for profile + onboarding (read-only in admin panel)
userSchema.add({
  phone: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, default: '' },
  about: { type: String, default: '' },
  profilePic: { type: String, default: '' },
  googleId: { type: String },
  lastLogin: { type: Date },
  purchasedCourses: { type: [String], default: [] },
  socialLinks: [{ platform: String, url: String }],
  experience: [
    {
      title: String,
      company: String,
      description: String,
      startDate: String,
      endDate: String,
      current: Boolean,
    },
  ],
  skillsInProgress: [{ name: String, progress: Number }],
  completionCertificates: [{ name: String, organization: String }],
  personalityType: { type: String, default: '' },
  personalityScores: {
    openness: { type: Number, default: 0 },
    conscientiousness: { type: Number, default: 0 },
    extraversion: { type: Number, default: 0 },
    agreeableness: { type: Number, default: 0 },
    neuroticism: { type: Number, default: 0 },
  },
  careerRecommendations: { type: [String], default: [] },
  skillRecommendations: { type: [String], default: [] },
  activityLog: [{ message: String, timestamp: Date }],
  onboardingComplete: { type: Boolean, default: false },
  onboarding: { type: mongoose.Schema.Types.ObjectId, ref: 'Onboarding' },
  futureMeCard: { type: mongoose.Schema.Types.ObjectId, ref: 'FutureMeCard' },
  onboardingAnswers: { type: Map, of: String, default: {} },
});

// Backward-compatible: some existing docs may not have createdAt, role, isPremium, etc.
// Mongoose will supply defaults on reads, and we only set missing fields on writes.

userSchema.index({ email: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

