import { Schema, model } from 'mongoose';

export interface ITransaction {
  userEmail: string;
  purchaseType: string;
  amount: number;
  country: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  currency?: string | null;
  store?: string | null;
  environment?: string | null;
  productId?: string | null;
  entitlementId?: string | null;
  eventType?: string | null;
  transactionId?: string | null;
  originalTransactionId?: string | null;
  revenueCatEventId?: string | null;
  revenueCatAppUserId?: string | null;
  originalAppUserId?: string | null;
  aliases?: string[];
  purchasedAt?: Date | null;
  expiresAt?: Date | null;
  rawEvent?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    purchaseType: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    country: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      default: 'paid',
    },
    paymentMethod: { type: String, default: 'manual', trim: true },
    currency: { type: String, default: null, trim: true },
    store: { type: String, default: null, trim: true },
    environment: { type: String, default: null, trim: true },
    productId: { type: String, default: null, trim: true },
    entitlementId: { type: String, default: null, trim: true },
    eventType: { type: String, default: null, trim: true },
    transactionId: { type: String, default: null, trim: true },
    originalTransactionId: { type: String, default: null, trim: true },
    revenueCatEventId: { type: String, default: null, trim: true },
    revenueCatAppUserId: { type: String, default: null, trim: true },
    originalAppUserId: { type: String, default: null, trim: true },
    aliases: { type: [String], default: [] },
    purchasedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    rawEvent: { type: Schema.Types.Mixed, default: null },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ revenueCatEventId: 1 }, { unique: true, sparse: true });
transactionSchema.index({ originalTransactionId: 1, createdAt: -1 });
transactionSchema.index({ revenueCatAppUserId: 1, createdAt: -1 });

export const transactionModel = model<ITransaction>('Transaction', transactionSchema);
