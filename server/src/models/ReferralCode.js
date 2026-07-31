import mongoose from 'mongoose';
import { REFERRAL_CODE_STATUS, REFERRAL_REVOKE_REASONS } from '../constants/roles.js';
import { createAccessModelProxy } from './accessModelFactory.js';

/**
 * One row per code lifetime. Soft-revoke by inserting a new active row —
 * never mutate `code` in place. Uniqueness is GLOBAL on `code` (active + revoked)
 * so dead codes are never reissued.
 */
export const referralCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 8,
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(REFERRAL_CODE_STATUS),
      default: REFERRAL_CODE_STATUS.ACTIVE,
      index: true,
    },
    revokedAt: { type: Date, default: null },
    revokedReason: {
      type: String,
      enum: Object.values(REFERRAL_REVOKE_REASONS),
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Global unique — revoked codes stay reserved forever.
referralCodeSchema.index({ code: 1 }, { unique: true });
// Efficient "get this counselor's active code" without scanning history.
referralCodeSchema.index({ counselorId: 1, status: 1 });

export const ReferralCode = createAccessModelProxy(
  'ReferralCode',
  referralCodeSchema,
  'referral_codes'
);
