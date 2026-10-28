import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMailProject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  gmailUser: string;
  encryptedAppPassword: string;
  defaultFromName: string;
  defaultReplyTo?: string;
  apiKey: string;
  isActive: boolean;
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
    apiKey: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true },
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

export const MailProject: Model<IMailProject> =
  mongoose.models.MailProject || mongoose.model<IMailProject>("MailProject", MailProjectSchema);
