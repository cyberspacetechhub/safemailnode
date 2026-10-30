import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  isActive: boolean;
  isFrozen: boolean;
  isLocked: boolean;
  lockReason?: string;
  failedLoginAttempts: number;
  lastLoginAt?: Date;

  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;

  passwordResetToken?: string;
  passwordResetExpires?: Date;

  /** ISO timestamp when the user accepted Terms of Service */
  acceptedTermsAt?: Date;
  /** Set when user requests account deletion — hard purge after 30 days */
  deletedAt?: Date;

  plan: "free" | "pro" | "enterprise";
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

    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    acceptedTermsAt: { type: Date },
    deletedAt: { type: Date, index: true },

    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    allowMultipleProjects: { type: Boolean, default: true },
    maxProjects: { type: Number, default: 2, min: 1 },
    dailyQuota: { type: Number, default: 100, min: 0 },
  },
  { timestamps: true }
);

if (
  mongoose.models.User &&
  (!mongoose.models.User.schema.path("emailVerificationCode") ||
    !mongoose.models.User.schema.path("isFrozen") ||
    !mongoose.models.User.schema.path("deletedAt") ||
    !mongoose.models.User.schema.path("acceptedTermsAt"))
) {
  delete mongoose.models.User;
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
