import { ROLES } from './accessConstants.js';

export function getAccessRole(user) {
  return user?.accessRole || null;
}

export function isAccessUser(user) {
  return Boolean(getAccessRole(user));
}

export function isSuperAdmin(user) {
  return getAccessRole(user) === ROLES.SUPER_ADMIN;
}

export function isOrgAdmin(user) {
  return getAccessRole(user) === ROLES.WL_ADMIN;
}

export function isCounselor(user) {
  return getAccessRole(user) === ROLES.COUNSELOR;
}

export function getAccessOrganizationId(user) {
  return user?.organizationId || null;
}

export function getAccessCounselorId(user) {
  return user?.counselorId || null;
}

export function accessRoleLabel(role) {
  if (role === ROLES.SUPER_ADMIN) return 'Super Admin';
  if (role === ROLES.WL_ADMIN) return 'Organization Admin';
  if (role === ROLES.COUNSELOR) return 'Counselor';
  return role || 'User';
}
