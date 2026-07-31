import mongoose from 'mongoose';
import { ASSESSMENT_STATUS, REGISTRATION_TYPES } from '../constants/roles.js';
import { createAccessModelProxy } from './accessModelFactory.js';

const assessmentSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(ASSESSMENT_STATUS),
      default: ASSESSMENT_STATUS.IN_PROGRESS,
    },
    score: { type: String, default: '—' },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    author: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const studentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    /** Mutable — current ownership (manual reassignment may change this). */
    assignedCounselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor',
      default: null,
      index: true,
    },
    /**
     * Immutable snapshot of who the referral attributed at registration.
     * Set once when registrationType === referral; never overwritten on reassignment.
     */
    referredCounselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor',
      default: null,
      index: true,
    },
    /** Exact code string entered at signup (survives regenerate / revoke). */
    referralCodeEntered: { type: String, uppercase: true, trim: true, default: null },
    /** Optional FK into referral_codes for history joins. */
    referralCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReferralCode',
      default: null,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, select: false, default: '' },
    registrationType: {
      type: String,
      enum: Object.values(REGISTRATION_TYPES),
      default: REGISTRATION_TYPES.SKIPPED,
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    assessments: { type: [assessmentSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ organizationId: 1, assignedCounselorId: 1 });
studentSchema.index({ organizationId: 1, createdAt: -1 });

export const Student = createAccessModelProxy('Student', studentSchema, 'students');
