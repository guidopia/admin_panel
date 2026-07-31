export const ACCESS_ROLES = {
  SUPER_ADMIN: 'super-admin',
  WL_ADMIN: 'white-label-admin',
  COUNSELOR: 'counselor',
};

export const ACCESS_ROLE_VALUES = Object.values(ACCESS_ROLES);

export const ENTITY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

/** Soft-revoke lifecycle for `referral_codes` rows (global unique on `code`). */
export const REFERRAL_CODE_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
};

export const REFERRAL_REVOKE_REASONS = {
  REGENERATED: 'regenerated',
  COUNSELOR_DEACTIVATED: 'counselor_deactivated',
};

export const REGISTRATION_TYPES = {
  REFERRAL: 'referral',
  SKIPPED: 'skipped',
};

export const ASSESSMENT_STATUS = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
};
