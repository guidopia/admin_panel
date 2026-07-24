import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as organizationService from '../services/organizationService.js';
import {
  createOrganizationSchema,
  parseOrThrow,
  updateOrganizationSchema,
} from '../validators/accessValidators.js';

export const listOrganizations = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const organizations = await organizationService.listOrganizations({ status });
  res.json({ organizations });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const organization = await organizationService.getOrganizationById(req.params.id);
  res.json({ organization });
});

export const getCurrentOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.accessUser?.organizationId;
  if (!organizationId) throw new ApiError(400, 'No organization associated with this account');
  const organization = await organizationService.getOrganizationById(organizationId);
  res.json({ organization });
});

export const createOrganization = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createOrganizationSchema, req.body, ApiError);
  const organization = await organizationService.createOrganization(payload);
  res.status(201).json({ organization });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(updateOrganizationSchema, req.body, ApiError);
  const organization = await organizationService.updateOrganization(req.params.id, payload);
  res.json({ organization });
});

export const toggleOrganizationStatus = asyncHandler(async (req, res) => {
  const organization = await organizationService.toggleOrganizationStatus(req.params.id);
  res.json({ organization });
});
