import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { ACCESS_ROLES } from '../constants/roles.js';
import { AccessUser } from '../models/AccessUser.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/**
 * Authenticate Access Control users (super-admin / white-label-admin / counselor).
 * JWT must include typ: 'access'.
 */
export const requireAccessAuth = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  if (!token) throw new ApiError(401, 'Unauthorized');

  const env = getEnv();
  if (!env.jwtSecret) throw new ApiError(500, 'Missing JWT_SECRET');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid token');
  }

  if (decoded.typ !== 'access') {
    throw new ApiError(401, 'Invalid access token');
  }

  const user = await AccessUser.findById(decoded.sub).select(
    '_id name email accessRole organizationId counselorId status'
  );
  if (!user) throw new ApiError(401, 'Unauthorized');
  if (user.status !== 'active') throw new ApiError(403, 'Account is inactive');

  req.accessUser = {
    id: String(user._id),
    name: user.name || '',
    email: user.email || '',
    accessRole: user.accessRole,
    organizationId: user.organizationId ? String(user.organizationId) : null,
    counselorId: user.counselorId ? String(user.counselorId) : null,
    status: user.status,
  };

  next();
});

/** Require one of the given access roles */
export function requireAccessRoles(...roles) {
  const allowed = roles.flat();
  return (req, _res, next) => {
    if (!req.accessUser) return next(new ApiError(401, 'Unauthorized'));
    if (!allowed.includes(req.accessUser.accessRole)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    return next();
  };
}

export const requireSuperAdmin = requireAccessRoles(ACCESS_ROLES.SUPER_ADMIN);

export const requireOrgAdminOrSuper = requireAccessRoles(
  ACCESS_ROLES.SUPER_ADMIN,
  ACCESS_ROLES.WL_ADMIN
);

export const requireAnyAccessRole = requireAccessRoles(
  ACCESS_ROLES.SUPER_ADMIN,
  ACCESS_ROLES.WL_ADMIN,
  ACCESS_ROLES.COUNSELOR
);

/**
 * Resolve the organization scope for the current request.
 * Super Admin may pass organizationId via query/body/params.
 * Org-scoped roles are locked to their own organization.
 */
export function resolveOrganizationScope(req, { required = false } = {}) {
  const user = req.accessUser;
  if (!user) throw new ApiError(401, 'Unauthorized');

  if (user.accessRole === ACCESS_ROLES.SUPER_ADMIN) {
    const orgId =
      req.params.organizationId ||
      req.query.organizationId ||
      req.body?.organizationId ||
      null;
    if (required && !orgId) throw new ApiError(400, 'organizationId is required');
    return orgId || null;
  }

  if (!user.organizationId) throw new ApiError(403, 'No organization assigned');
  return user.organizationId;
}

/**
 * Resolve organizationId for resource creation (counselors, etc.).
 * Super Admin must supply organizationId in the body.
 * Org Admin is scoped to their organization; body org must match when both are present.
 */
export function resolveCreateOrganizationId(req, payloadOrganizationId) {
  const user = req.accessUser;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const payloadOrgId = payloadOrganizationId ? String(payloadOrganizationId).trim() : '';

  if (user.accessRole === ACCESS_ROLES.SUPER_ADMIN) {
    const orgId =
      payloadOrgId ||
      req.body?.organizationId ||
      req.query?.organizationId ||
      req.params?.organizationId ||
      null;
    if (!orgId) throw new ApiError(400, 'Organization ID is required');
    return String(orgId);
  }

  if (user.accessRole === ACCESS_ROLES.WL_ADMIN) {
    const userOrgId = user.organizationId ? String(user.organizationId) : '';
    if (userOrgId && payloadOrgId && userOrgId !== payloadOrgId) {
      throw new ApiError(403, 'Access denied to this organization');
    }
    const orgId = userOrgId || payloadOrgId;
    if (!orgId) throw new ApiError(400, 'Organization ID is required');
    return orgId;
  }

  throw new ApiError(403, 'Insufficient permissions');
}

/**
 * Ensure a resource's organizationId is visible to the caller.
 */
export function assertOrgAccess(accessUser, organizationId) {
  if (!accessUser) throw new ApiError(401, 'Unauthorized');
  if (accessUser.accessRole === ACCESS_ROLES.SUPER_ADMIN) return;
  if (!organizationId || String(organizationId) !== String(accessUser.organizationId)) {
    throw new ApiError(403, 'Access denied to this organization');
  }
}
