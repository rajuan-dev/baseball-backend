import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { storageService } from '../../services/storage.service';
import { buildPublicFileUrl } from '../../utils/fileUrl';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';

import { situationModel } from './situation.model';

const mapSituation = (item: Record<string, unknown>) => {
  const imageUrl = buildPublicFileUrl(item.image as string | undefined);

  return {
    id: String(item._id),
    title: item.title,
    category: item.category,
    shortLabel: item.shortLabel,
    featured: item.featured,
    isFeatured: item.featured,
    diagramVariant: item.diagramVariant,
    instructions: item.instructions,
    image: imageUrl,
    imageUrl,
    displayOrder: item.displayOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const getAll = async (query: {
  page?: unknown;
  limit?: unknown;
  featured?: unknown;
  search?: unknown;
} = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  const featured = typeof query.featured === 'string' ? query.featured : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  if (featured === 'true' || featured === 'false') {
    filter.featured = featured === 'true';
  }

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  const [situations, total] = await Promise.all([
    situationModel.find(filter).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    situationModel.countDocuments(filter),
  ]);

  return {
    items: situations.map((item) => mapSituation(item as unknown as Record<string, unknown>)),
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getFeatured = async () => {
  const situations = await situationModel
    .find({ featured: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  return situations.map((item) => {
    const mapped = mapSituation(item as unknown as Record<string, unknown>);

    return {
      id: mapped.id,
      title: mapped.title,
      category: mapped.category,
      shortLabel: mapped.shortLabel,
      image: mapped.image,
      imageUrl: mapped.imageUrl,
      diagramVariant: mapped.diagramVariant,
      details: mapped.instructions,
      instructions: mapped.instructions,
      featured: mapped.featured,
      displayOrder: mapped.displayOrder,
    };
  });
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
    image?: string;
    displayOrder: number;
    featured?: boolean;
    isFeatured?: boolean;
    diagramVariant?: 'infield' | 'outfield';
    instructions?: { player: string; detail: string }[];
  },
) => {
  const next = {
    title: payload.title,
    category: payload.category || 'Specific Situations',
    shortLabel: payload.shortLabel || payload.title.slice(0, 2).toUpperCase(),
    image: payload.image ?? '',
    displayOrder: payload.displayOrder,
    featured: payload.featured ?? payload.isFeatured ?? false,
    diagramVariant: payload.diagramVariant || 'infield',
    instructions: payload.instructions || [],
  };

  const previousSituation = id ? await situationModel.findById(id).lean() : null;
  const situation = id
    ? await situationModel.findByIdAndUpdate(id, next, { new: true, runValidators: true }).lean()
    : await situationModel.create(next).then((doc) => doc.toObject());

  if (!situation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Situation not found');
  }

  await storageService.deleteFileIfChanged(previousSituation?.image, situation.image);

  return mapSituation(situation as unknown as Record<string, unknown>);
};

const remove = async (id: string) => {
  const deleted = await situationModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Situation not found');
  }

  await storageService.deleteFileIfChanged(deleted.image, null);
};

export const situationService = {
  getAll,
  getFeatured,
  getById,
  save,
  remove,
};
