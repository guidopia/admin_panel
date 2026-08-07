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

/**
 * Resolve organizationId for create flows (counselor, etc.).
 * Prefers explicit form selection, then session org, then loaded org context.
 */
export function resolveCreateOrganizationId({
  user,
  organizations = [],
  formOrganizationId,
  currentOrganization,
}) {
  const fromForm = String(formOrganizationId || '').trim();
  const fromUser = getAccessOrganizationId(user);
  const fromCurrent = currentOrganization?.id ? String(currentOrganization.id) : '';
  const fromSingle = organizations.length === 1 ? String(organizations[0]?.id || '') : '';
  const fromFirst = organizations[0]?.id ? String(organizations[0].id) : '';

  if (isOrgAdmin(user)) {
    return fromUser || fromCurrent || fromSingle || fromForm;
  }

  if (isSuperAdmin(user)) {
    return fromForm || fromSingle || fromFirst;
  }

  return fromForm || fromUser || fromCurrent;
}
