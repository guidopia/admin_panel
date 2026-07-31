import { ACCESS_ROLES, ENTITY_STATUS, REFERRAL_REVOKE_REASONS } from '../constants/roles.js';
import { AccessUser } from '../models/AccessUser.js';
import { Counselor } from '../models/Counselor.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/apiError.js';
import { serializeCounselor } from '../utils/serializers.js';
import {
  assertOrganizationExists,
  createActiveReferralCode,
  generateTempPassword,
  hashPassword,
  regenerateCounselorReferralCode,
  softRevokeActiveCodes,
} from './accessHelpers.js';

export async function listCounselors({ organizationId, status, q } = {}) {
  const filter = {};
  if (organizationId) filter.organizationId = organizationId;
  if (status && status !== 'all') filter.status = status;
  if (q?.trim()) {
    const s = q.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { referralCode: { $regex: s, $options: 'i' } },
    ];
  }

  const counselors = await Counselor.find(filter).sort({ createdAt: -1 }).lean();
  return counselors.map(serializeCounselor);
}

export async function getCounselorById(id) {
  const counselor = await Counselor.findById(id).lean();
  if (!counselor) throw new ApiError(404, 'Counselor not found');
  return serializeCounselor(counselor);
}

export async function createCounselor(payload) {
  await assertOrganizationExists(payload.organizationId);

  const email = payload.email.toLowerCase().trim();
  const [userClash, counselorClash] = await Promise.all([
    AccessUser.findOne({ email }),
    Counselor.findOne({ email }),
  ]);
  if (userClash || counselorClash) throw new ApiError(409, 'Email already in use');

  const plainPassword = payload.password || generateTempPassword();
  const passwordHash = await hashPassword(plainPassword);

  let accessUser;
  let counselor;
  try {
    accessUser = await AccessUser.create({
      name: payload.name,
      email,
      password: passwordHash,
      accessRole: ACCESS_ROLES.COUNSELOR,
      organizationId: payload.organizationId,
      status: ENTITY_STATUS.ACTIVE,
    });

    counselor = await Counselor.create({
      organizationId: payload.organizationId,
      accessUserId: accessUser._id,
      name: payload.name,
      email,
      phone: payload.phone || '',
      referralCode: '',
      status: ENTITY_STATUS.ACTIVE,
      studentCount: 0,
    });

    accessUser.counselorId = counselor._id;
    await accessUser.save();

    const codeRow = await createActiveReferralCode({
      counselorId: counselor._id,
      organizationId: counselor.organizationId,
      name: counselor.name,
    });

    counselor.referralCode = codeRow.code;
    await counselor.save();

    return {
      counselor: serializeCounselor(counselor),
      temporaryPassword: payload.password ? undefined : plainPassword,
    };
  } catch (err) {
    if (counselor?._id) {
      await softRevokeActiveCodes(counselor._id, REFERRAL_REVOKE_REASONS.REGENERATED).catch(
        () => {}
      );
      await Counselor.findByIdAndDelete(counselor._id).catch(() => {});
    }
    if (accessUser?._id) {
      await AccessUser.findByIdAndDelete(accessUser._id).catch(() => {});
    }
    throw err;
  }
}

export async function updateCounselor(id, payload) {
  const counselor = await Counselor.findById(id);
  if (!counselor) throw new ApiError(404, 'Counselor not found');

  if (payload.email) {
    const email = payload.email.toLowerCase().trim();
    const clash = await Counselor.findOne({ email, _id: { $ne: counselor._id } });
    if (clash) throw new ApiError(409, 'Email already in use');
    counselor.email = email;
  }
  if (payload.name !== undefined) counselor.name = payload.name;
  if (payload.phone !== undefined) counselor.phone = payload.phone;

  const becomingInactive =
    payload.status !== undefined &&
    payload.status === ENTITY_STATUS.INACTIVE &&
    counselor.status !== ENTITY_STATUS.INACTIVE;

  if (payload.status !== undefined) counselor.status = payload.status;

  await counselor.save();

  if (becomingInactive) {
    await softRevokeActiveCodes(counselor._id, REFERRAL_REVOKE_REASONS.COUNSELOR_DEACTIVATED);
    counselor.referralCode = '';
    await counselor.save();
  }

  if (counselor.accessUserId) {
    const accessUser = await AccessUser.findById(counselor.accessUserId).select('+password');
    if (accessUser) {
      if (payload.name !== undefined) accessUser.name = payload.name;
      if (payload.email) accessUser.email = counselor.email;
      if (payload.status !== undefined) accessUser.status = payload.status;
      if (payload.password) accessUser.password = await hashPassword(payload.password);
      await accessUser.save();
    }
  }

  return serializeCounselor(counselor);
}

/**
 * Delete counselor: unassign students (keep students), revoke codes, remove login + profile.
 */
export async function deleteCounselor(id) {
  const counselor = await Counselor.findById(id);
  if (!counselor) throw new ApiError(404, 'Counselor not found');

  await Student.updateMany(
    { assignedCounselorId: counselor._id },
    { $set: { assignedCounselorId: null } }
  );

  await softRevokeActiveCodes(counselor._id, REFERRAL_REVOKE_REASONS.COUNSELOR_DEACTIVATED);

  if (counselor.accessUserId) {
    await AccessUser.findByIdAndDelete(counselor.accessUserId);
  }

  await Counselor.findByIdAndDelete(counselor._id);
  return { id: String(counselor._id), unassigned: true };
}

export async function regenerateReferralCode(id) {
  const counselor = await Counselor.findById(id);
  if (!counselor) throw new ApiError(404, 'Counselor not found');
  if (counselor.status !== ENTITY_STATUS.ACTIVE) {
    throw new ApiError(400, 'Cannot regenerate code for an inactive counselor');
  }

  const row = await regenerateCounselorReferralCode(counselor);
  counselor.referralCode = row.code;
  await counselor.save();
  return serializeCounselor(counselor);
}

export async function syncStudentCount(counselorId) {
  const { refreshCounselorStudentCount } = await import('./accessHelpers.js');
  return refreshCounselorStudentCount(counselorId);
}
