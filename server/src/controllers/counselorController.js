import { ACCESS_ROLES } from '../constants/roles.js';
import {
  assertOrgAccess,
  resolveCreateOrganizationId,
} from '../middleware/accessAuthMiddleware.js';
import * as counselorService from '../services/counselorService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createCounselorSchema,
  listQuerySchema,
  parseOrThrow,
  updateCounselorSchema,
} from '../validators/accessValidators.js';

export const listCounselors = asyncHandler(async (req, res) => {
  const query = parseOrThrow(listQuerySchema, req.query, ApiError);

  let organizationId = null;
  if (req.accessUser.accessRole === ACCESS_ROLES.SUPER_ADMIN) {
    organizationId = query.organizationId || null;
  } else if (req.accessUser.accessRole === ACCESS_ROLES.WL_ADMIN) {
    organizationId = req.accessUser.organizationId;
  } else if (req.accessUser.accessRole === ACCESS_ROLES.COUNSELOR) {
    // Counselors only see themselves
    const self = await counselorService.getCounselorById(req.accessUser.counselorId);
    return res.json({ counselors: [self] });
  }

  const counselors = await counselorService.listCounselors({
    organizationId,
    status: query.status,
    q: query.q,
  });
  res.json({ counselors });
});

export const getCounselor = asyncHandler(async (req, res) => {
  const counselor = await counselorService.getCounselorById(req.params.id);

  if (req.accessUser.accessRole === ACCESS_ROLES.COUNSELOR) {
    if (String(req.accessUser.counselorId) !== String(counselor.id)) {
      throw new ApiError(403, 'Access denied');
    }
  } else {
    assertOrgAccess(req.accessUser, counselor.organizationId);
  }

  res.json({ counselor });
});

export const createCounselor = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createCounselorSchema, req.body, ApiError);
  const organizationId = resolveCreateOrganizationId(req, payload.organizationId);

  const result = await counselorService.createCounselor({
    ...payload,
    organizationId,
  });
  res.status(201).json(result);
});

export const updateCounselor = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(updateCounselorSchema, req.body, ApiError);
  const existing = await counselorService.getCounselorById(req.params.id);
  assertOrgAccess(req.accessUser, existing.organizationId);
  const counselor = await counselorService.updateCounselor(req.params.id, payload);
  res.json({ counselor });
});

export const deleteCounselor = asyncHandler(async (req, res) => {
  const existing = await counselorService.getCounselorById(req.params.id);
  assertOrgAccess(req.accessUser, existing.organizationId);
  const result = await counselorService.deleteCounselor(req.params.id);
  res.json({ message: 'Counselor deleted; assigned students are now unassigned', ...result });
});

export const regenerateReferralCode = asyncHandler(async (req, res) => {
  const existing = await counselorService.getCounselorById(req.params.id);
  assertOrgAccess(req.accessUser, existing.organizationId);
  const counselor = await counselorService.regenerateReferralCode(req.params.id);
  res.json({ counselor });
});
