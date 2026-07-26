import mongoose from 'mongoose';
import { ENTITY_STATUS } from '../constants/roles.js';
import { createAccessModelProxy } from './accessModelFactory.js';

export const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    branding: { type: String, trim: true, default: '' },
    primaryColor: { type: String, trim: true, default: '#171717' },
    logoUrl: { type: String, trim: true, default: '' },
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

organizationSchema.index({ name: 1 });

export const Organization = createAccessModelProxy(
  'Organization',
  organizationSchema,
  'organizations'
);
