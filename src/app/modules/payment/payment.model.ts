import { Schema, model } from 'mongoose';

export interface ITransaction {
  userEmail: string;
  purchaseType: string;
  amount: number;
  country: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
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
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const transactionModel = model<ITransaction>('Transaction', transactionSchema);
