import mongoose from 'mongoose';

import { ACCESS_ROLES, ENTITY_STATUS, REGISTRATION_TYPES } from '../constants/roles.js';
import { Counselor } from '../models/Counselor.js';
import { Organization } from '../models/Organization.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/apiError.js';
import { normalizeReferralCode } from '../utils/referralCode.js';
import { serializeStudent } from '../utils/serializers.js';
import {
  assertOrganizationExists,
  findCounselorByReferralCode,
  hashPassword,
  refreshCounselorStudentCount,
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
 * Public / admin student registration.
 * With referral code → auto-assign counselor + org.
 * Without → requires organizationId; remains unassigned.
 */
export async function registerStudent(payload) {
  const email = payload.email.toLowerCase().trim();
  const existing = await Student.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already in use');

  let organizationId = payload.organizationId || null;
  let assignedCounselorId = null;
  let referralCodeEntered = null;
  let registrationType = REGISTRATION_TYPES.SKIPPED;

  if (payload.referralCode) {
    const code = normalizeReferralCode(payload.referralCode);
    const counselor = await findCounselorByReferralCode(code);
    if (!counselor) throw new ApiError(400, 'Invalid referral code');

    const org = await Organization.findById(counselor.organizationId);
    if (!org || org.status !== ENTITY_STATUS.ACTIVE) {
      throw new ApiError(400, 'Organization is not accepting registrations');
    }

    organizationId = counselor.organizationId;
    assignedCounselorId = counselor._id;
    referralCodeEntered = code;
    registrationType = REGISTRATION_TYPES.REFERRAL;
  } else {
    if (!organizationId) {
      throw new ApiError(400, 'organizationId is required when no referral code is provided');
    }
    await assertOrganizationExists(organizationId);
  }

  const passwordHash = payload.password ? await hashPassword(payload.password) : '';

  const student = await Student.create({
    organizationId,
    assignedCounselorId,
    referralCodeEntered,
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
    await refreshCounselorStudentCount(assignedCounselorId);
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
    if (!student.referralCodeEntered) {
      student.referralCodeEntered = counselor.referralCode;
      student.registrationType = REGISTRATION_TYPES.REFERRAL;
    }
  }

  await student.save();

  if (previousCounselorId) await refreshCounselorStudentCount(previousCounselorId);
  if (student.assignedCounselorId) {
    await refreshCounselorStudentCount(student.assignedCounselorId);
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
