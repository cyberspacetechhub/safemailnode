import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  projectName: string;
  gmailUser: string;
  fromName: string;
  to: string;
  subject: string;
  status: "sent" | "failed";
  messageId?: string;
  errorMessage?: string;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "MailProject", required: true, index: true },
    projectName: { type: String, required: true },
    gmailUser: { type: String, required: true },
    fromName: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    messageId: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EmailLogSchema.index({ userId: 1, createdAt: -1 });
// Auto-expire logs after 90 days (matches privacy policy)
EmailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
