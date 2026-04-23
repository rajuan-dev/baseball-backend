import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { drillModel } from '../drill/drill.model';

import { drillCategoryModel } from './drill-category.model';

const mapCategory = async (category: Record<string, unknown>) => {
  const totalDrills = await drillModel.countDocuments({ categoryId: category._id });

  return {
    id: String(category._id),
    name: category.name,
    subtitle: category.subtitle,
    cover: category.cover,
    icon: category.icon,
    accessLevel: category.accessLevel,
    totalDrills,
    numberOfDrills: totalDrills,
    image: category.cover,
    accentIcon: category.accentIcon,
  };
};

const getAll = async () => {
  const categories = await drillCategoryModel.find().sort({ createdAt: -1 }).lean();
  return Promise.all(categories.map((category) => mapCategory(category as unknown as Record<string, unknown>)));
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
    name: string;
    subtitle: string;
    cover: string;
    icon: string;
    accessLevel: 'free' | 'premium';
    accentIcon?: string;
  },
) => {
  const next = {
    ...payload,
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
