export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  WL_ADMIN: 'white-label-admin',
  COUNSELOR: 'counselor',
};

export const REFERRAL_CODE_RULES = [
  'Unique across the platform',
  '6–8 characters, uppercase, no spaces',
  'Auto-generated when an admin creates a counselor',
  'Immutable by default — admin may regenerate if required',
];

export function orgName(orgId, orgs = []) {
  if (!orgId) return '—';
  return orgs.find((o) => o.id === orgId)?.name || '—';
}

export function counselorName(counselorId, counselors = []) {
  if (!counselorId) return null;
  return counselors.find((c) => c.id === counselorId)?.name || '—';
}
