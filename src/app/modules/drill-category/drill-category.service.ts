import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { buildVersionedPublicFileUrl } from '../../utils/fileUrl';
import { storageService } from '../../services/storage.service';
import { drillModel } from '../drill/drill.model';

import { drillCategoryModel } from './drill-category.model';

const mapCategory = async (category: Record<string, unknown>) => {
  const totalDrills = await drillModel.countDocuments({ categoryId: category._id });
  const version = category.updatedAt ?? category.createdAt;
  const coverUrl = buildVersionedPublicFileUrl(category.cover as string | undefined, version);
  const iconUrl = buildVersionedPublicFileUrl(category.icon as string | undefined, version);

  return {
    id: String(category._id),
    name: category.name,
    categoryName: category.name,
    subtitle: category.subtitle,
    cover: coverUrl,
    coverUrl,
    coverPhoto: coverUrl,
    coverPhotoUrl: coverUrl,
    icon: iconUrl,
    iconUrl,
    accessLevel: category.accessLevel,
    isPremium: category.accessLevel === 'premium',
    isLocked: category.accessLevel === 'premium',
    totalDrills,
    numberOfDrills: totalDrills,
    image: coverUrl,
    imageUrl: coverUrl,
    accentIcon: category.accentIcon,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

const buildFilter = (query: {
  accessLevel?: unknown;
  search?: unknown;
}) => {
  const filter: Record<string, unknown> = {};
  const accessLevel = typeof query.accessLevel === 'string' ? query.accessLevel.toLowerCase() : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  if (accessLevel && accessLevel !== 'all' && accessLevel !== 'locked') {
    filter.accessLevel = accessLevel;
  }

  if (accessLevel === 'locked') {
    filter.accessLevel = 'premium';
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { subtitle: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};

const getAll = async (query: {
  page?: unknown;
  limit?: unknown;
  accessLevel?: unknown;
  search?: unknown;
} = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = buildFilter(query);
  const [categories, total] = await Promise.all([
    drillCategoryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    drillCategoryModel.countDocuments(filter),
  ]);
  const items = await Promise.all(
    categories.map((category) => mapCategory(category as unknown as Record<string, unknown>)),
  );

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getById = async (id: string) => {
  const category = await drillCategoryModel.findById(id).lean();
  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill category not found');
  }

  return mapCategory(category as unknown as Record<string, unknown>);
};

const save = async (
  id: string | undefined,
  payload: {
    name?: string;
    categoryName?: string;
    subtitle: string;
    cover?: string;
    coverPhoto?: string;
    icon: string;
    accessLevel: 'free' | 'premium';
    accentIcon?: string;
  },
) => {
  const next = {
    name: payload.name || payload.categoryName,
    subtitle: payload.subtitle,
    cover: payload.cover || payload.coverPhoto,
    icon: payload.icon,
    accessLevel: payload.accessLevel,
    accentIcon: payload.accentIcon || 'baseball-outline',
  };

  const previousCategory = id ? await drillCategoryModel.findById(id).lean() : null;
  const category = id
    ? await drillCategoryModel.findByIdAndUpdate(id, next, { new: true, runValidators: true }).lean()
    : await drillCategoryModel.create(next).then((doc) => doc.toObject());

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill category not found');
  }

  await Promise.all([
    storageService.deleteFileIfChanged(previousCategory?.cover, category.cover),
    storageService.deleteFileIfChanged(previousCategory?.icon, category.icon),
  ]);

  return mapCategory(category as unknown as Record<string, unknown>);
};

const remove = async (id: string) => {
  const drillCount = await drillModel.countDocuments({ categoryId: id });
  if (drillCount > 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Remove drills in this category before deleting it');
  }

  const deleted = await drillCategoryModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill category not found');
  }

  await Promise.all([
    storageService.deleteFileIfChanged(deleted.cover, null),
    storageService.deleteFileIfChanged(deleted.icon, null),
  ]);
};

export const drillCategoryService = {
  getAll,
  getById,
  save,
  remove,
};
