import mongoose from 'mongoose';
import { ENTITY_STATUS } from '../constants/roles.js';
import { createAccessModelProxy } from './accessModelFactory.js';

export const counselorSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    accessUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccessUser',
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    /**
     * Denormalized cache of the counselor's current active code for Admin UI lists.
     * Source of truth + uniqueness live in `referral_codes` (never mutate that code in place).
     */
    referralCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
      minlength: 0,
      maxlength: 8,
    },
    status: {
      type: String,
      enum: Object.values(ENTITY_STATUS),
      default: ENTITY_STATUS.ACTIVE,
      index: true,
    },
    studentCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

counselorSchema.index({ email: 1 }, { unique: true });
counselorSchema.index({ organizationId: 1, status: 1 });
counselorSchema.index({ referralCode: 1 });

export const Counselor = createAccessModelProxy('Counselor', counselorSchema, 'counselors');
