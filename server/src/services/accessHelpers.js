import bcrypt from 'bcryptjs';

import { ACCESS_ROLES, ENTITY_STATUS } from '../constants/roles.js';
import { AccessUser } from '../models/AccessUser.js';
import { Counselor } from '../models/Counselor.js';
import { Organization } from '../models/Organization.js';
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

export async function generateUniqueReferralCode(name, { maxAttempts = 20 } = {}) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = buildReferralCodeCandidate(name);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Counselor.exists({ referralCode: code });
    if (!exists) return code;
  }
  throw new ApiError(500, 'Unable to generate unique referral code');
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

export async function findCounselorByReferralCode(code) {
  const referralCode = normalizeReferralCode(code);
  if (!referralCode) return null;
  return Counselor.findOne({
    referralCode,
    status: ENTITY_STATUS.ACTIVE,
  });
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
