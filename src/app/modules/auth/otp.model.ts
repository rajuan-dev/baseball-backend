import { Schema, model } from 'mongoose';

export interface IOtp {
  email: string;
  code: string;
  purpose: 'app_login' | 'admin_reset';
  expiresAt: Date;
  consumedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['app_login', 'admin_reset'],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const otpModel = model<IOtp>('Otp', otpSchema);
