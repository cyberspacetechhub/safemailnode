import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  /**
   * Account status flags for production admin control:
   * - isActive: false = suspended/deactivated
   * - isFrozen: true  = user can log in, but all outgoing email API calls are paused
   * - isLocked: true  = account is locked (cannot log in or send emails; e.g. security lock or brute-force)
   */
  isActive: boolean;
  isFrozen: boolean;
  isLocked: boolean;
  lockReason?: string;
  failedLoginAttempts: number;
  lastLoginAt?: Date;

  /**
   * Email verification fields
   */
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;

  plan: "free" | "pro" | "enterprise";
  /**
   * Admin-controlled toggle & limits:
   * Default maxProjects is 2, default dailyQuota is 100.
   * Admin can increase or decrease both per user.
   */
  allowMultipleProjects: boolean;
  maxProjects: number;
  dailyQuota: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    isActive: { type: Boolean, default: true },
    isFrozen: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    lockReason: { type: String, trim: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lastLoginAt: { type: Date },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpires: { type: Date },

    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    allowMultipleProjects: { type: Boolean, default: true },
    maxProjects: { type: Number, default: 2, min: 1 },
    dailyQuota: { type: Number, default: 100, min: 0 },
  },
  { timestamps: true }
);

// Ensure Next.js hot-reload doesn't keep an older cached User schema missing new fields
if (
  mongoose.models.User &&
  (!mongoose.models.User.schema.path("emailVerificationCode") ||
    !mongoose.models.User.schema.path("isFrozen"))
) {
  delete mongoose.models.User;
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
