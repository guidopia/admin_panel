import mongoose from 'mongoose';

export const futureMeCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: { type: mongoose.Schema.Types.Mixed },
    futureRole: { type: String, default: '' },
    tagline: { type: String, default: '' },
    tags: [{ type: String }],
    mindset: { type: String, default: '' },
    salary: { type: String, default: '' },
    keySkills: [{ type: String }],
    mentors: [{ type: String }],
    cta: { type: String, default: '' },
    personalityType: { type: String, default: '' },
    careerRecommendations: [{ type: String }],
    skillRecommendations: [{ type: String }],
    createdAt: { type: Date },
  },
  { minimize: false }
);

export const FutureMeCard =
  mongoose.models.FutureMeCard ||
  mongoose.model('FutureMeCard', futureMeCardSchema, 'futuremecards');
