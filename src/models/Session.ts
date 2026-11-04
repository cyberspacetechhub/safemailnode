import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  ip?: string;
  userAgent?: string;
  lastActiveAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ip: { type: String },
    userAgent: { type: String },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-expire sessions after 7 days of inactivity
SessionSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
