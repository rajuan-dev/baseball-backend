import { InferSchemaType, Schema, model } from 'mongoose';

const drillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'DrillCategory',
      required: true,
    },
    description: { type: String, required: true, trim: true },
    cover: { type: String, required: true, trim: true },
    accessLevel: {
      type: String,
      required: true,
      enum: ['free', 'premium'],
    },
    steps: {
      type: [String],
      default: [],
    },
    equipment: {
      type: [String],
      default: [],
    },
    focusPoints: {
      type: [String],
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export type IDrill = InferSchemaType<typeof drillSchema> & { _id?: string };

export const drillModel = model<IDrill>('Drill', drillSchema);
