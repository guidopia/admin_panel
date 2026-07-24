import { ACCESS_ROLES, ENTITY_STATUS } from '../constants/roles.js';
import { AccessUser } from '../models/AccessUser.js';
import { ApiError } from '../utils/apiError.js';
import { serializeAdmin } from '../utils/serializers.js';
import {
  assertOrganizationExists,
  generateTempPassword,
  hashPassword,
} from './accessHelpers.js';

export async function listAdmins({ organizationId, status } = {}) {
  const filter = { accessRole: ACCESS_ROLES.WL_ADMIN };
  if (organizationId) filter.organizationId = organizationId;
  if (status && status !== 'all') filter.status = status;

  const admins = await AccessUser.find(filter).sort({ createdAt: -1 }).lean();
  return admins.map(serializeAdmin);
}

export async function createAdmin(payload) {
  await assertOrganizationExists(payload.organizationId);

  const email = payload.email.toLowerCase().trim();
  const exists = await AccessUser.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');

  const plainPassword = payload.password || generateTempPassword();
  const password = await hashPassword(plainPassword);

  const admin = await AccessUser.create({
    name: payload.name,
    email,
    password,
    accessRole: ACCESS_ROLES.WL_ADMIN,
    organizationId: payload.organizationId,
    status: ENTITY_STATUS.ACTIVE,
  });

  return {
    admin: serializeAdmin(admin),
    temporaryPassword: payload.password ? undefined : plainPassword,
  };
}

export async function updateAdmin(id, payload) {
  const admin = await AccessUser.findOne({ _id: id, accessRole: ACCESS_ROLES.WL_ADMIN });
  if (!admin) throw new ApiError(404, 'Admin not found');

  if (payload.email) {
    const email = payload.email.toLowerCase().trim();
    const clash = await AccessUser.findOne({ email, _id: { $ne: admin._id } });
    if (clash) throw new ApiError(409, 'Email already in use');
    admin.email = email;
  }
  if (payload.name !== undefined) admin.name = payload.name;
  if (payload.status !== undefined) admin.status = payload.status;
  if (payload.password) admin.password = await hashPassword(payload.password);

  await admin.save();
  return serializeAdmin(admin);
}

export async function getAdminById(id) {
  const admin = await AccessUser.findOne({ _id: id, accessRole: ACCESS_ROLES.WL_ADMIN }).lean();
  if (!admin) throw new ApiError(404, 'Admin not found');
  return serializeAdmin(admin);
}
