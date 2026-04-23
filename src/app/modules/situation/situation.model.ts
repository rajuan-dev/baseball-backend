import { Schema, model } from 'mongoose';

export interface ISituationInstruction {
  player: string;
  detail: string;
}

export interface ISituation {
  title: string;
  category: string;
  shortLabel: string;
  featured: boolean;
  diagramVariant: 'infield' | 'outfield';
  instructions: ISituationInstruction[];
  image: string;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const situationInstructionSchema = new Schema<ISituationInstruction>(
  {
    player: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const situationSchema = new Schema<ISituation>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    shortLabel: { type: String, required: true, trim: true },
    featured: { type: Boolean, default: false },
    diagramVariant: {
      type: String,
      required: true,
      enum: ['infield', 'outfield'],
    },
    instructions: {
      type: [situationInstructionSchema],
      default: [],
    },
    image: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const situationModel = model<ISituation>('Situation', situationSchema);
