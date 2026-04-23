import { Schema, model } from 'mongoose';

export interface ITransaction {
  userEmail: string;
  purchaseType: string;
  amount: number;
  country: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    purchaseType: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    country: { type: String, required: true, trim: true },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const transactionModel = model<ITransaction>('Transaction', transactionSchema);
