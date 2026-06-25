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
    youtubeUrl: { type: String, default: null, trim: true },
    listIcon: { type: String, default: 'baseball-outline', trim: true },
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
      type: [Schema.Types.Mixed],
      default: [],
    },
    focusPoints: {
      type: [Schema.Types.Mixed],
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
