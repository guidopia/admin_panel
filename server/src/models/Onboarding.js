import mongoose from 'mongoose';

const onboardingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneNumber: { type: String, default: '' },
    studentType: { type: String, enum: ['school', 'college', ''], default: '' },

    schoolClass: { type: String, default: '' },
    schoolStream: { type: String, default: '' },
    strongestAreas: [{ type: String }],
    learningFormats: [{ type: String }],
    motivation: { type: String, default: '' },
    futureExcitement: { type: String, default: '' },

    collegeYear: { type: String, default: '' },
    collegeDegree: { type: String, default: '' },
    otherDegree: { type: String, default: '' },
    strengths: [{ type: String }],
    careerGoals: [{ type: String }],
    industries: [{ type: String }],
    lifestyle: { type: String, default: '' },
    learningPreference: [{ type: String }],

    joiningReason: { type: String, default: '' },
    otherReason: { type: String, default: '' },

    completedAt: { type: Date },
  },
  { minimize: false }
);

export const Onboarding =
  mongoose.models.Onboarding || mongoose.model('Onboarding', onboardingSchema, 'onboardings');
