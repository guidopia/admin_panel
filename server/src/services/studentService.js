import mongoose from 'mongoose';

import { ACCESS_ROLES, ENTITY_STATUS, REGISTRATION_TYPES } from '../constants/roles.js';
import { Counselor } from '../models/Counselor.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/apiError.js';
import {
  isReferralCodeProvided,
} from '../utils/referralCode.js';
import { serializeCounselor, serializeStudent } from '../utils/serializers.js';
import {
  adjustCounselorStudentCount,
  hashPassword,
  resolveActiveReferral,
  resolveDefaultOrganizationId,
} from './accessHelpers.js';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listStudents(accessUser, query = {}) {
  const filter = {};

  if (accessUser.accessRole === ACCESS_ROLES.COUNSELOR) {
    if (!accessUser.counselorId) throw new ApiError(403, 'No counselor profile linked');
    filter.assignedCounselorId = accessUser.counselorId;
    filter.organizationId = accessUser.organizationId;
  } else if (accessUser.accessRole === ACCESS_ROLES.WL_ADMIN) {
    filter.organizationId = accessUser.organizationId;
    if (query.unassigned === 'true') filter.assignedCounselorId = null;
    if (query.counselorId) filter.assignedCounselorId = query.counselorId;
  } else {
    // Super Admin
    if (query.organizationId) filter.organizationId = query.organizationId;
    if (query.unassigned === 'true') filter.assignedCounselorId = null;
    if (query.counselorId) filter.assignedCounselorId = query.counselorId;
  }

  if (query.q?.trim()) {
    const s = escapeRegex(query.q.trim());
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const [total, docs] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    students: docs.map(serializeStudent),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getStudentById(accessUser, id) {
  const student = await Student.findById(id).lean();
  if (!student) throw new ApiError(404, 'Student not found');
  assertStudentVisible(accessUser, student);
  return serializeStudent(student);
}

function assertStudentVisible(accessUser, student) {
  if (accessUser.accessRole === ACCESS_ROLES.SUPER_ADMIN) return;

  if (String(student.organizationId) !== String(accessUser.organizationId)) {
    throw new ApiError(403, 'Access denied');
  }

  if (accessUser.accessRole === ACCESS_ROLES.COUNSELOR) {
    if (String(student.assignedCounselorId || '') !== String(accessUser.counselorId || '')) {
      throw new ApiError(403, 'Access denied');
    }
  }
}

/**
 * Website / S2S student registration.
 * - No code → DEFAULT_ORGANIZATION_ID, unassigned.
 * - Code provided + valid → assign counselor; snapshot referredCounselorId + referralCodeEntered.
 * - Code provided + invalid → 400 hard-block (do not create student).
 */
export async function registerStudent(payload) {
  const email = payload.email.toLowerCase().trim();
  const existing = await Student.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already in use');

  let organizationId = null;
  let assignedCounselorId = null;
  let referredCounselorId = null;
  let referralCodeEntered = null;
  let referralCodeId = null;
  let registrationType = REGISTRATION_TYPES.SKIPPED;

  if (isReferralCodeProvided(payload.referralCode)) {
    const resolved = await resolveActiveReferral(payload.referralCode);
    if (!resolved.ok) {
      const err = new ApiError(400, resolved.message);
      err.reason = resolved.reason;
      throw err;
    }

    organizationId = resolved.counselor.organizationId;
    assignedCounselorId = resolved.counselor._id;
    referredCounselorId = resolved.counselor._id; // immutable attribution snapshot
    referralCodeEntered = resolved.code;
    referralCodeId = resolved.row._id;
    registrationType = REGISTRATION_TYPES.REFERRAL;
  } else {
    organizationId = await resolveDefaultOrganizationId();
  }

  const passwordHash = payload.password ? await hashPassword(payload.password) : '';

  const student = await Student.create({
    organizationId,
    assignedCounselorId,
    referredCounselorId,
    referralCodeEntered,
    referralCodeId,
    name: payload.name,
    email,
    phone: payload.phone || '',
    password: passwordHash,
    registrationType,
    progress: 0,
    assessments: [],
    notes: [],
  });

  if (assignedCounselorId) {
    await adjustCounselorStudentCount(assignedCounselorId, 1);
  }

  return serializeStudent(student);
}

export async function assignStudent(accessUser, studentId, counselorId) {
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found');

  if (accessUser.accessRole === ACCESS_ROLES.COUNSELOR) {
    throw new ApiError(403, 'Counselors cannot assign students');
  }

  if (accessUser.accessRole === ACCESS_ROLES.WL_ADMIN) {
    if (String(student.organizationId) !== String(accessUser.organizationId)) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const previousCounselorId = student.assignedCounselorId
    ? String(student.assignedCounselorId)
    : null;

  if (counselorId === null || counselorId === undefined || counselorId === '') {
    student.assignedCounselorId = null;
  } else {
    const counselor = await Counselor.findById(counselorId);
    if (!counselor) throw new ApiError(404, 'Counselor not found');
    if (String(counselor.organizationId) !== String(student.organizationId)) {
      throw new ApiError(400, 'Counselor belongs to a different organization');
    }
    if (counselor.status !== ENTITY_STATUS.ACTIVE) {
      throw new ApiError(400, 'Counselor is inactive');
    }

    student.assignedCounselorId = counselor._id;
    // Do NOT overwrite referredCounselorId — attribution snapshot stays immutable.
    // Only fill referralCodeEntered for display if empty (manual assign without prior referral).
    if (!student.referralCodeEntered && counselor.referralCode) {
      student.referralCodeEntered = counselor.referralCode;
      if (!student.registrationType || student.registrationType === REGISTRATION_TYPES.SKIPPED) {
        student.registrationType = REGISTRATION_TYPES.REFERRAL;
      }
      if (!student.referredCounselorId) {
        student.referredCounselorId = counselor._id;
      }
    }
  }

  await student.save();

  if (previousCounselorId && previousCounselorId !== String(student.assignedCounselorId || '')) {
    await adjustCounselorStudentCount(previousCounselorId, -1);
  }
  if (student.assignedCounselorId && String(student.assignedCounselorId) !== previousCounselorId) {
    await adjustCounselorStudentCount(student.assignedCounselorId, 1);
  }

  return serializeStudent(student);
}

export async function addStudentNote(accessUser, studentId, text) {
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found');
  assertStudentVisible(accessUser, student);

  student.notes.push({
    id: new mongoose.Types.ObjectId().toString(),
    author: accessUser.name || accessUser.email,
    text,
    at: new Date(),
  });
  await student.save();
  return serializeStudent(student);
}

export async function listUnassignedStudents(accessUser, query = {}) {
  return listStudents(accessUser, { ...query, unassigned: 'true' });
}

/**
 * Validate a counselor referral code (used by the student website).
 * Empty / whitespace → not_provided (caller should treat as optional skip, not hard error for UI idle).
 */
export async function validateReferralCode(rawCode) {
  if (!isReferralCodeProvided(rawCode)) {
    return {
      valid: false,
      reason: 'not_provided',
      message: 'Referral code is required',
    };
  }

  const resolved = await resolveActiveReferral(rawCode);
  if (!resolved.ok) {
    return {
      valid: false,
      reason: resolved.reason,
      message: resolved.message,
    };
  }

  return {
    valid: true,
    organizationId: String(resolved.counselor.organizationId),
    counselorId: String(resolved.counselor._id),
    counselorName: resolved.counselor.name || '',
    referralCode: resolved.code,
    counselor: serializeCounselor(resolved.counselor),
  };
}

/**
 * Lookup a student by email for the integrated website (live assignment).
 */
export async function getStudentByEmail(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!normalizedEmail) return null;

  const student = await Student.findOne({ email: normalizedEmail }).lean();
  if (!student) return null;

  let counselor = null;
  if (student.assignedCounselorId) {
    const c = await Counselor.findById(student.assignedCounselorId).lean();
    if (c) counselor = serializeCounselor(c);
  }

  return {
    student: serializeStudent(student),
    counselor,
    assignmentStatus: student.assignedCounselorId ? 'assigned' : 'unassigned',
  };
}
