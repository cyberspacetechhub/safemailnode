import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency?: string;
  routingOrSwift?: string;
  note?: string;
}

export interface ICryptoWallet {
  coin: string;
  network: string;
  walletAddress: string;
  note?: string;
}

export interface IPaymentLink {
  label: string;
  url: string;
  description?: string;
}

export interface ISystemSettings extends Document {
  key: string;
  isSupportEnabled: boolean;
  supportTitle: string;
  supportSubtitle: string;
  supportMessage: string;
  contactEmail?: string;
  bankAccounts: IBankAccount[];
  cryptoWallets: ICryptoWallet[];
  paymentLinks: IPaymentLink[];

  systemGmailUser?: string;
  systemEncryptedAppPassword?: string;
  systemFromName: string;

  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, default: "global", unique: true },
    isSupportEnabled: { type: Boolean, default: true },
    supportTitle: {
      type: String,
      default: "Support SafeMailNode Development",
    },
    supportSubtitle: {
      type: String,
      default:
        "SafeMailNode is currently free to use while we grow. If this service saves you time and money, consider supporting our infrastructure and development!",
    },
    supportMessage: {
      type: String,
      default:
        "Every contribution goes directly toward server costs, maintenance, and keeping the Gmail SMTP gateway fast and reliable for developers.",
    },
    contactEmail: { type: String, default: "" },
    bankAccounts: [
      {
        bankName: { type: String, default: "" },
        accountName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        currency: { type: String, default: "NGN" },
        routingOrSwift: { type: String, default: "" },
        note: { type: String, default: "" },
      },
    ],
    cryptoWallets: [
      {
        coin: { type: String, default: "" },
        network: { type: String, default: "" },
        walletAddress: { type: String, default: "" },
        note: { type: String, default: "" },
      },
    ],
    paymentLinks: [
      {
        label: { type: String, default: "" },
        url: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],
    systemGmailUser: { type: String, trim: true, lowercase: true },
    systemEncryptedAppPassword: { type: String },
    systemFromName: { type: String, default: "SafeMailNode Security" },
  },
  { timestamps: true }
);

if (mongoose.models.SystemSettings) {
  delete mongoose.models.SystemSettings;
}

export const SystemSettings: Model<ISystemSettings> =
  mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
