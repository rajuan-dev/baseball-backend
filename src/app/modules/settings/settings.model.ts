import { Schema, model } from 'mongoose';

export interface ISettings {
  homeEyebrow: string;
  homeTitle: string;
  homePrimaryCta: string;
  homeSecondaryCta: string;
  featuredSectionTitle: string;
  featuredSectionSubtitle: string;
  situationImageUri: string | null;
  privacyPolicy: string;
  terms: string;
  aboutUs: string;
  fullUnlockPrice: number;
  appVersion: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    homeEyebrow: { type: String, required: true },
    homeTitle: { type: String, required: true },
    homePrimaryCta: { type: String, required: true },
    homeSecondaryCta: { type: String, required: true },
    featuredSectionTitle: { type: String, required: true },
    featuredSectionSubtitle: { type: String, required: true },
    situationImageUri: { type: String, default: null },
    privacyPolicy: { type: String, required: true },
    terms: { type: String, required: true },
    aboutUs: { type: String, required: true },
    fullUnlockPrice: { type: Number, required: true, min: 1 },
    appVersion: { type: String, required: true, default: '2.4.0 Elite' },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const settingsModel = model<ISettings>('Settings', settingsSchema);
