import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { drillModel } from '../drill/drill.model';

import { drillCategoryModel } from './drill-category.model';

const mapCategory = async (category: Record<string, unknown>) => {
  const totalDrills = await drillModel.countDocuments({ categoryId: category._id });

  return {
    id: String(category._id),
    name: category.name,
    categoryName: category.name,
    subtitle: category.subtitle,
    cover: category.cover,
    coverPhoto: category.cover,
    coverPhotoUrl: category.cover,
    icon: category.icon,
    iconUrl: category.icon,
    accessLevel: category.accessLevel,
    isPremium: category.accessLevel === 'premium',
    isLocked: category.accessLevel === 'premium',
    totalDrills,
    numberOfDrills: totalDrills,
    image: category.cover,
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

  const category = id
    ? await drillCategoryModel.findByIdAndUpdate(id, next, { new: true, runValidators: true }).lean()
    : await drillCategoryModel.create(next).then((doc) => doc.toObject());

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill category not found');
  }

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
};

export const drillCategoryService = {
  getAll,
  getById,
  save,
  remove,
};
