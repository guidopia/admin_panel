import mongoose from 'mongoose';
import { ACCESS_ROLE_VALUES, ACCESS_ROLES, ENTITY_STATUS } from '../constants/roles.js';
import { createAccessModelProxy } from './accessModelFactory.js';

export const accessUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    accessRole: {
      type: String,
      enum: ACCESS_ROLE_VALUES,
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    /** Linked counselor profile when accessRole === counselor */
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ENTITY_STATUS),
      default: ENTITY_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

accessUserSchema.index({ email: 1 }, { unique: true });
accessUserSchema.index({ organizationId: 1, accessRole: 1 });

accessUserSchema.pre('validate', function ensureOrgScope(next) {
  if (this.accessRole === ACCESS_ROLES.SUPER_ADMIN) {
    this.organizationId = null;
    this.counselorId = null;
  } else if (!this.organizationId) {
    return next(new Error('organizationId is required for organization-scoped roles'));
  }
  return next();
});

export const AccessUser = createAccessModelProxy('AccessUser', accessUserSchema, 'access_users');
