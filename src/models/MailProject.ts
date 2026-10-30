import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMailProject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  gmailUser: string;
  encryptedAppPassword: string;
  defaultFromName: string;
  defaultReplyTo?: string;
  /** Bcrypt hash of the raw API key — used for lookup on every send-email request */
  hashedApiKey: string;
  /** Short prefix shown in the UI (e.g. ms_live_a1b2c3…) — NOT the full key */
  apiKeyPrefix: string;
  isActive: boolean;
  isRevoked: boolean;
  totalSent: number;
  totalFailed: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MailProjectSchema = new Schema<IMailProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    gmailUser: { type: String, required: true, lowercase: true, trim: true },
    encryptedAppPassword: { type: String, required: true },
    defaultFromName: { type: String, required: true, trim: true, default: "Notifications" },
    defaultReplyTo: { type: String, trim: true },
    hashedApiKey: { type: String, required: true, index: true },
    apiKeyPrefix: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isRevoked: { type: Boolean, default: false },
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

export const MailProject: Model<IMailProject> =
  mongoose.models.MailProject || mongoose.model<IMailProject>("MailProject", MailProjectSchema);
