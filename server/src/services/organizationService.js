import { ACCESS_ROLES, ENTITY_STATUS } from '../constants/roles.js';
import { Organization } from '../models/Organization.js';
import { ApiError } from '../utils/apiError.js';
import { serializeOrganization } from '../utils/serializers.js';
import { getOrganizationCounts } from './accessHelpers.js';

export async function listOrganizations({ status } = {}) {
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const orgs = await Organization.find(filter).sort({ createdAt: -1 }).lean();
  const withCounts = await Promise.all(
    orgs.map(async (org) => {
      const counts = await getOrganizationCounts(org._id);
      return serializeOrganization(org, counts);
    })
  );
  return withCounts;
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
  const counts = await getOrganizationCounts(org._id);
  return serializeOrganization(org, counts);
}

export { ACCESS_ROLES };
