import { Schema, model } from 'mongoose';

export interface IAppUser {
  _id?: string;
  email: string;
  isPremium: boolean;
  isActive: boolean;
  premiumUnlockedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const appUserSchema = new Schema<IAppUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    premiumUnlockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const appUserModel = model<IAppUser>('AppUser', appUserSchema);
