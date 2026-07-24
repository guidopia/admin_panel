import { ACCESS_ROLES } from '../constants/roles.js';
import { assertOrgAccess } from '../middleware/accessAuthMiddleware.js';
import * as adminService from '../services/adminService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createAdminSchema,
  listQuerySchema,
  parseOrThrow,
  updateAdminSchema,
} from '../validators/accessValidators.js';

export const listAdmins = asyncHandler(async (req, res) => {
  const query = parseOrThrow(listQuerySchema, req.query, ApiError);
  let organizationId = query.organizationId || null;

  if (req.accessUser.accessRole === ACCESS_ROLES.WL_ADMIN) {
    organizationId = req.accessUser.organizationId;
  }

  const admins = await adminService.listAdmins({
    organizationId,
    status: query.status,
  });
  res.json({ admins });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createAdminSchema, req.body, ApiError);
  const result = await adminService.createAdmin(payload);
  res.status(201).json(result);
});

export const getAdmin = asyncHandler(async (req, res) => {
  const admin = await adminService.getAdminById(req.params.id);
  assertOrgAccess(req.accessUser, admin.organizationId);
  res.json({ admin });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(updateAdminSchema, req.body, ApiError);
  const existing = await adminService.getAdminById(req.params.id);
  assertOrgAccess(req.accessUser, existing.organizationId);
  const admin = await adminService.updateAdmin(req.params.id, payload);
  res.json({ admin });
});
