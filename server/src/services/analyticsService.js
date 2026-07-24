import { ACCESS_ROLES, ENTITY_STATUS, REGISTRATION_TYPES } from '../constants/roles.js';
import { AccessUser } from '../models/AccessUser.js';
import { Counselor } from '../models/Counselor.js';
import { Organization } from '../models/Organization.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/apiError.js';

async function monthBuckets(filter, months = 6) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const rows = await Student.aggregate([
    { $match: { ...filter, createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.count]));
  const monthlySignups = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    monthlySignups.push(map.get(key) || 0);
  }
  return monthlySignups;
}

export async function getAnalytics(accessUser, organizationId) {
  if (accessUser.accessRole === ACCESS_ROLES.COUNSELOR) {
    if (!accessUser.counselorId) throw new ApiError(403, 'No counselor profile linked');
    const filter = {
      organizationId: accessUser.organizationId,
      assignedCounselorId: accessUser.counselorId,
    };
    const [totalStudents, referralStudents, monthlySignups] = await Promise.all([
      Student.countDocuments(filter),
      Student.countDocuments({ ...filter, registrationType: REGISTRATION_TYPES.REFERRAL }),
      monthBuckets(filter),
    ]);
    const referralConversionRate =
      totalStudents === 0 ? 0 : Math.round((referralStudents / totalStudents) * 100);

    return {
      organizationId: accessUser.organizationId,
      counselorId: accessUser.counselorId,
      totalCounselors: 1,
      totalStudents,
      unassignedStudents: 0,
      referralConversionRate,
      monthlySignups,
    };
  }

  if (accessUser.accessRole === ACCESS_ROLES.SUPER_ADMIN && !organizationId) {
    const [
      totalOrganizations,
      activeOrganizations,
      totalCounselors,
      totalStudents,
      unassignedStudents,
      referralStudents,
      monthlySignups,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: ENTITY_STATUS.ACTIVE }),
      Counselor.countDocuments(),
      Student.countDocuments(),
      Student.countDocuments({ assignedCounselorId: null }),
      Student.countDocuments({ registrationType: REGISTRATION_TYPES.REFERRAL }),
      monthBuckets({}),
    ]);

    const referralConversionRate =
      totalStudents === 0 ? 0 : Math.round((referralStudents / totalStudents) * 100);

    return {
      totalOrganizations,
      activeOrganizations,
      totalCounselors,
      totalStudents,
      unassignedStudents,
      referralConversionRate,
      monthlySignups,
    };
  }

  const orgId =
    accessUser.accessRole === ACCESS_ROLES.SUPER_ADMIN
      ? organizationId
      : accessUser.organizationId;

  if (!orgId) throw new ApiError(400, 'organizationId is required');

  if (
    accessUser.accessRole !== ACCESS_ROLES.SUPER_ADMIN &&
    String(orgId) !== String(accessUser.organizationId)
  ) {
    throw new ApiError(403, 'Access denied');
  }

  const orgFilter = { organizationId: orgId };
  const [
    totalCounselors,
    totalStudents,
    unassignedStudents,
    referralStudents,
    adminCount,
    monthlySignups,
    org,
  ] = await Promise.all([
    Counselor.countDocuments(orgFilter),
    Student.countDocuments(orgFilter),
    Student.countDocuments({ ...orgFilter, assignedCounselorId: null }),
    Student.countDocuments({ ...orgFilter, registrationType: REGISTRATION_TYPES.REFERRAL }),
    AccessUser.countDocuments({
      organizationId: orgId,
      accessRole: ACCESS_ROLES.WL_ADMIN,
    }),
    monthBuckets(orgFilter),
    Organization.findById(orgId).lean(),
  ]);

  if (!org) throw new ApiError(404, 'Organization not found');

  const referralConversionRate =
    totalStudents === 0 ? 0 : Math.round((referralStudents / totalStudents) * 100);

  return {
    organizationId: String(orgId),
    organizationName: org.name,
    totalOrganizations: 1,
    activeOrganizations: org.status === ENTITY_STATUS.ACTIVE ? 1 : 0,
    totalCounselors,
    totalStudents,
    unassignedStudents,
    adminCount,
    referralConversionRate,
    monthlySignups,
  };
}
