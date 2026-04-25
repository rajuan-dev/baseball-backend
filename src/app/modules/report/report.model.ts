import { Schema, model } from 'mongoose';

export interface IReport {
  user: string;
  email: string;
  phone: string;
  city: string;
  title: string;
  status: 'Open' | 'Resolved';
  message: string;
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const reportSchema = new Schema<IReport>(
  {
    user: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    city: { type: String, default: 'Marietta', trim: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['Open', 'Resolved'],
      default: 'Open',
    },
    message: { type: String, required: true, trim: true },
    resolvedAt: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const reportModel = model<IReport>('Report', reportSchema);
