import { ACCESS_ROLES, ENTITY_STATUS } from '../constants/roles.js';
import { AccessUser } from '../models/AccessUser.js';
import { Counselor } from '../models/Counselor.js';
import { Organization } from '../models/Organization.js';
import { ReferralCode } from '../models/ReferralCode.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/apiError.js';
import { serializeOrganization } from '../utils/serializers.js';
import { getOrganizationCounts } from './accessHelpers.js';

function toCountMap(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), row.count || 0);
  }
  return map;
}

/** One aggregation pass per collection instead of N+1 count queries. */
async function getCountsByOrganizationIds(orgIds) {
  if (!orgIds.length) {
    return { admins: new Map(), counselors: new Map(), students: new Map() };
  }

  const [adminRows, counselorRows, studentRows] = await Promise.all([
    AccessUser.aggregate([
      {
        $match: {
          organizationId: { $in: orgIds },
          accessRole: ACCESS_ROLES.WL_ADMIN,
        },
      },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
    Counselor.aggregate([
      { $match: { organizationId: { $in: orgIds } } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
    Student.aggregate([
      { $match: { organizationId: { $in: orgIds } } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    admins: toCountMap(adminRows),
    counselors: toCountMap(counselorRows),
    students: toCountMap(studentRows),
  };
}

export async function listOrganizations({ status } = {}) {
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const orgs = await Organization.find(filter).sort({ createdAt: -1 }).lean();
  const orgIds = orgs.map((org) => org._id);
  const counts = await getCountsByOrganizationIds(orgIds);

  return orgs.map((org) => {
    const id = String(org._id);
    return serializeOrganization(org, {
      adminCount: counts.admins.get(id) || 0,
      counselorCount: counts.counselors.get(id) || 0,
      studentCount: counts.students.get(id) || 0,
    });
  });
}

export async function getOrganizationById(id) {
  const org = await Organization.findById(id).lean();
  if (!org) throw new ApiError(404, 'Organization not found');
  const counts = await getOrganizationCounts(org._id);
  return serializeOrganization(org, counts);
}

export async function createOrganization(payload) {
  const org = await Organization.create({
    name: payload.name,
    branding: payload.branding || '',
    primaryColor: payload.primaryColor || '#171717',
    logoUrl: payload.logoUrl || '',
    status: ENTITY_STATUS.ACTIVE,
  });
  return serializeOrganization(org, {
    adminCount: 0,
    counselorCount: 0,
    studentCount: 0,
  });
}

export async function updateOrganization(id, payload) {
  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, 'Organization not found');

  if (payload.name !== undefined) org.name = payload.name;
  if (payload.branding !== undefined) org.branding = payload.branding;
  if (payload.primaryColor !== undefined) org.primaryColor = payload.primaryColor;
  if (payload.logoUrl !== undefined) org.logoUrl = payload.logoUrl;
  if (payload.status !== undefined) org.status = payload.status;

  await org.save();
  const counts = await getOrganizationCounts(org._id);
  return serializeOrganization(org, counts);
}

export async function toggleOrganizationStatus(id) {
  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, 'Organization not found');
  org.status = org.status === ENTITY_STATUS.ACTIVE ? ENTITY_STATUS.INACTIVE : ENTITY_STATUS.ACTIVE;
  await org.save();
  // Skip recount on toggle — status flip must be instant; counts unchanged.
  return serializeOrganization(org.toObject(), {
    adminCount: undefined,
    counselorCount: undefined,
    studentCount: undefined,
  });
}

/**
 * Hard-delete an organization and all related Access Control data.
 * Super Admin only (enforced at route). Super Admin accounts are never deleted.
 */
export async function deleteOrganization(id) {
  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, 'Organization not found');

  const orgId = org._id;

  const [students, counselors, accessUsers, referralCodes] = await Promise.all([
    Student.deleteMany({ organizationId: orgId }),
    Counselor.deleteMany({ organizationId: orgId }),
    AccessUser.deleteMany({
      organizationId: orgId,
      accessRole: { $ne: ACCESS_ROLES.SUPER_ADMIN },
    }),
    ReferralCode.deleteMany({ organizationId: orgId }),
  ]);

  await Organization.findByIdAndDelete(orgId);

  return {
    id: String(orgId),
    deleted: true,
    removed: {
      students: students.deletedCount || 0,
      counselors: counselors.deletedCount || 0,
      accessUsers: accessUsers.deletedCount || 0,
      referralCodes: referralCodes.deletedCount || 0,
    },
  };
}

export { ACCESS_ROLES };
