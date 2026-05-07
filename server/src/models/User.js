import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, default: '' },
    isPremium: { type: Boolean, default: false, index: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    minimize: false,
  }
);

// Backward-compatible: some existing docs may not have createdAt, role, isPremium, etc.
// Mongoose will supply defaults on reads, and we only set missing fields on writes.

userSchema.index({ email: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

