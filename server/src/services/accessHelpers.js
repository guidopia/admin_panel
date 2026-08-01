import bcrypt from 'bcryptjs';

import {
  ACCESS_ROLES,
  ENTITY_STATUS,
  REFERRAL_CODE_STATUS,
  REFERRAL_REVOKE_REASONS,
} from '../constants/roles.js';
import { AccessUser } from '../models/AccessUser.js';
import { Counselor } from '../models/Counselor.js';
import { Organization } from '../models/Organization.js';
import { ReferralCode } from '../models/ReferralCode.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/apiError.js';
import { buildReferralCodeCandidate, normalizeReferralCode } from '../utils/referralCode.js';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function generateTempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let out = '';
  for (let i = 0; i < 12; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Allocate a globally unique code and insert an active referral_codes row.
 * Retries on collision (app-level + DB unique index as final authority).
 */
export async function createActiveReferralCode(
  { counselorId, organizationId, name },
  { maxAttempts = 20 } = {}
) {
  if (!counselorId || !organizationId) {
    throw new ApiError(500, 'counselorId and organizationId are required to create a referral code');
  }

  let lastErr;
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = buildReferralCodeCandidate(name);
    try {
      const row = await ReferralCode.create({
        code,
        counselorId,
        organizationId,
        status: REFERRAL_CODE_STATUS.ACTIVE,
      });
      await Counselor.findByIdAndUpdate(counselorId, { referralCode: code });
      return row;
    } catch (err) {
      // Duplicate key on global unique `code`
      if (err?.code === 11000) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw new ApiError(500, 'Unable to generate unique referral code', { cause: lastErr });
}

/** @deprecated Prefer createActiveReferralCode — kept for seed scripts that only need a string. */
export async function generateUniqueReferralCode(name, { maxAttempts = 20 } = {}) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = buildReferralCodeCandidate(name);
    // eslint-disable-next-line no-await-in-loop
    const exists = await ReferralCode.exists({ code });
    if (!exists) return code;
  }
  throw new ApiError(500, 'Unable to generate unique referral code');
}

export async function getActiveReferralCodeForCounselor(counselorId) {
  if (!counselorId) return null;
  return ReferralCode.findOne({
    counselorId,
    status: REFERRAL_CODE_STATUS.ACTIVE,
  });
}

export async function softRevokeActiveCodes(counselorId, reason) {
  const now = new Date();
  const result = await ReferralCode.updateMany(
    { counselorId, status: REFERRAL_CODE_STATUS.ACTIVE },
    {
      $set: {
        status: REFERRAL_CODE_STATUS.REVOKED,
        revokedAt: now,
        revokedReason: reason,
      },
    }
  );
  return result;
}

/**
 * Soft-revoke current active code(s), insert a new active row, refresh counselor cache.
 */
export async function regenerateCounselorReferralCode(counselor) {
  await softRevokeActiveCodes(counselor._id, REFERRAL_REVOKE_REASONS.REGENERATED);
  const row = await createActiveReferralCode({
    counselorId: counselor._id,
    organizationId: counselor.organizationId,
    name: counselor.name,
  });
  return row;
}

export async function getOrganizationCounts(organizationId) {
  const orgId = organizationId;
  const [adminCount, counselorCount, studentCount] = await Promise.all([
    AccessUser.countDocuments({
      organizationId: orgId,
      accessRole: ACCESS_ROLES.WL_ADMIN,
    }),
    Counselor.countDocuments({ organizationId: orgId }),
    Student.countDocuments({ organizationId: orgId }),
  ]);
  return { adminCount, counselorCount, studentCount };
}

/** Atomic studentCount adjustment — safe under concurrent registrations. */
export async function adjustCounselorStudentCount(counselorId, delta) {
  if (!counselorId || !delta) return;
  await Counselor.findByIdAndUpdate(counselorId, { $inc: { studentCount: delta } });
  // Clamp floor at 0 if we somehow went negative
  await Counselor.updateOne(
    { _id: counselorId, studentCount: { $lt: 0 } },
    { $set: { studentCount: 0 } }
  );
}

export async function refreshCounselorStudentCount(counselorId) {
  if (!counselorId) return 0;
  const count = await Student.countDocuments({ assignedCounselorId: counselorId });
  await Counselor.findByIdAndUpdate(counselorId, { studentCount: count });
  return count;
}

export async function assertOrganizationExists(organizationId) {
  const org = await Organization.findById(organizationId);
  if (!org) throw new ApiError(404, 'Organization not found');
  return org;
}

/**
 * Resolve an active referral code row + counselor + org for validation/register.
 * Returns { ok, reason, message, row?, counselor?, org? }.
 */
export async function resolveActiveReferral(rawCode) {
  const code = normalizeReferralCode(rawCode);
  if (!code) {
    return { ok: false, reason: 'not_provided', message: 'Referral code is required' };
  }
  if (!/^[A-Z0-9]{6,8}$/.test(code)) {
    return {
      ok: false,
      reason: 'malformed',
      message: 'Referral code must be 6–8 letters/numbers',
    };
  }

  let row = await ReferralCode.findOne({ code });

  // Fallback: Admin UI shows counselors.referralCode (denormalized). If the
  // referral_codes row is missing (partial write / pre-migrate data), still
  // accept an active counselor with that cache and backfill the row.
  if (!row) {
    const counselorByCache = await Counselor.findOne({
      referralCode: code,
      status: ENTITY_STATUS.ACTIVE,
    });
    if (counselorByCache) {
      try {
        row = await ReferralCode.create({
          code,
          counselorId: counselorByCache._id,
          organizationId: counselorByCache.organizationId,
          status: REFERRAL_CODE_STATUS.ACTIVE,
        });
      } catch (err) {
        // Race / already inserted
        if (err?.code === 11000) {
          row = await ReferralCode.findOne({ code });
        } else {
          // Still allow validation via counselor cache if insert fails for other reasons
          const org = await Organization.findById(counselorByCache.organizationId);
          if (!org || org.status !== ENTITY_STATUS.ACTIVE) {
            return {
              ok: false,
              reason: 'org_inactive',
              message: 'Organization is not accepting registrations',
            };
          }
          return {
            ok: true,
            reason: null,
            message: null,
            row: null,
            counselor: counselorByCache,
            org,
            code,
          };
        }
      }
    }
  }

  if (!row) {
    return { ok: false, reason: 'not_found', message: 'Invalid referral code' };
  }
  if (row.status === REFERRAL_CODE_STATUS.REVOKED) {
    return {
      ok: false,
      reason: 'revoked',
      message: 'This referral code is no longer active',
    };
  }

  const counselor = await Counselor.findById(row.counselorId);
  if (!counselor || counselor.status !== ENTITY_STATUS.ACTIVE) {
    return {
      ok: false,
      reason: 'counselor_inactive',
      message: 'This counselor is not accepting new students',
    };
  }

  const org = await Organization.findById(counselor.organizationId);
  if (!org || org.status !== ENTITY_STATUS.ACTIVE) {
    return {
      ok: false,
      reason: 'org_inactive',
      message: 'Organization is not accepting registrations',
    };
  }

  return { ok: true, reason: null, message: null, row, counselor, org, code };
}

/** @deprecated Use resolveActiveReferral — kept for any leftover callers. */
export async function findCounselorByReferralCode(code) {
  const resolved = await resolveActiveReferral(code);
  return resolved.ok ? resolved.counselor : null;
}

/**
 * Organization used for direct (no-referral) website signups.
 * Prefer DEFAULT_ORGANIZATION_ID; otherwise reuse/create "Direct Signups".
 */
export async function resolveDefaultOrganizationId() {
  const configured = (process.env.DEFAULT_ORGANIZATION_ID || '').trim();
  if (configured) {
    const org = await Organization.findById(configured);
    if (org) return org._id;
  }

  const name = (process.env.DEFAULT_ORG_NAME || 'Direct Signups').trim();
  let org = await Organization.findOne({ name });
  if (!org) {
    org = await Organization.create({
      name,
      branding: '',
      status: ENTITY_STATUS.ACTIVE,
    });
  }
  return org._id;
}
