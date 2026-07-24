import { z } from 'zod';
import { ENTITY_STATUS, REGISTRATION_TYPES } from '../constants/roles.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const accessLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  branding: z.string().trim().max(40).optional().default(''),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid color')
    .optional()
    .default('#171717'),
  logoUrl: z.union([z.string().trim().url(), z.literal('')]).optional().default(''),
});

export const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  status: z.enum([ENTITY_STATUS.ACTIVE, ENTITY_STATUS.INACTIVE]).optional(),
});

export const createAdminSchema = z.object({
  organizationId: objectId,
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128).optional(),
});

export const updateAdminSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  status: z.enum([ENTITY_STATUS.ACTIVE, ENTITY_STATUS.INACTIVE]).optional(),
});

export const createCounselorSchema = z.object({
  organizationId: objectId.optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(40).optional().default(''),
  password: z.string().min(8).max(128).optional(),
});

export const updateCounselorSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  status: z.enum([ENTITY_STATUS.ACTIVE, ENTITY_STATUS.INACTIVE]).optional(),
  password: z.string().min(8).max(128).optional(),
});

export const registerStudentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(40).optional().default(''),
  password: z.string().min(8).max(128).optional(),
  referralCode: z.string().trim().min(6).max(8).optional(),
  /** Required when no referral code (admin places student into an org as unassigned) */
  organizationId: objectId.optional(),
});

export const assignStudentSchema = z.object({
  counselorId: objectId.nullable(),
});

export const addStudentNoteSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const listQuerySchema = z.object({
  organizationId: objectId.optional(),
  q: z.string().optional(),
  status: z.enum([ENTITY_STATUS.ACTIVE, ENTITY_STATUS.INACTIVE, 'all']).optional(),
  unassigned: z.enum(['true', 'false']).optional(),
  counselorId: objectId.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export function parseOrThrow(schema, data, ApiError) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid input', parsed.error.flatten());
  }
  return parsed.data;
}
