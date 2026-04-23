import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';

import { situationModel } from './situation.model';

const mapSituation = (item: Record<string, unknown>) => ({
  id: String(item._id),
  title: item.title,
  category: item.category,
  shortLabel: item.shortLabel,
  featured: item.featured,
  diagramVariant: item.diagramVariant,
  instructions: item.instructions,
  image: item.image,
  displayOrder: item.displayOrder,
  createdAt: item.createdAt,
});

const getAll = async () => {
  const situations = await situationModel
    .find()
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  return situations.map((item) => mapSituation(item as unknown as Record<string, unknown>));
};

const getById = async (id: string) => {
  const situation = await situationModel.findById(id).lean();
  if (!situation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Situation not found');
  }

  return mapSituation(situation as unknown as Record<string, unknown>);
};

const save = async (
  id: string | undefined,
  payload: {
    title: string;
    category?: string;
    shortLabel?: string;
    image: string;
    displayOrder: number;
    featured: boolean;
    diagramVariant?: 'infield' | 'outfield';
    instructions?: { player: string; detail: string }[];
  },
) => {
  const next = {
    title: payload.title,
    category: payload.category || 'Specific Situations',
    shortLabel: payload.shortLabel || payload.title.slice(0, 2).toUpperCase(),
    image: payload.image,
    displayOrder: payload.displayOrder,
    featured: payload.featured,
    diagramVariant: payload.diagramVariant || 'infield',
    instructions: payload.instructions || [],
  };

  const situation = id
    ? await situationModel.findByIdAndUpdate(id, next, { new: true, runValidators: true }).lean()
    : await situationModel.create(next).then((doc) => doc.toObject());

  if (!situation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Situation not found');
  }

  return mapSituation(situation as unknown as Record<string, unknown>);
};

export const situationService = {
  getAll,
  getById,
  save,
};
