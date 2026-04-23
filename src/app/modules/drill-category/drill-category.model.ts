import { Schema, model } from 'mongoose';

export interface IDrillCategory {
  name: string;
  subtitle: string;
  cover: string;
  icon: string;
  accessLevel: 'free' | 'premium';
  accentIcon: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const drillCategorySchema = new Schema<IDrillCategory>(
  {
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    cover: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    accessLevel: {
      type: String,
      required: true,
      enum: ['free', 'premium'],
    },
    accentIcon: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const drillCategoryModel = model<IDrillCategory>('DrillCategory', drillCategorySchema);
