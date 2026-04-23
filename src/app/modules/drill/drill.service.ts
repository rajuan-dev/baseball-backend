import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { drillCategoryModel } from '../drill-category/drill-category.model';

import { drillModel } from './drill.model';

const getAll = async (categoryId?: string) => {
  const matchStage = categoryId ? { categoryId: new mongoose.Types.ObjectId(categoryId) } : {};

  const drills = await drillModel.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'drillcategories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $addFields: {
        category: { $arrayElemAt: ['$category', 0] },
      },
    },
    {
      $project: {
        id: '$_id',
        name: 1,
        categoryId: 1,
        description: 1,
        cover: 1,
        accessLevel: 1,
        steps: 1,
        equipment: 1,
        focusPoints: 1,
        createdAt: 1,
        categoryName: '$category.name',
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return drills.map((item) => ({
    ...item,
    id: String(item.id),
    categoryId: String(item.categoryId),
  }));
};

const getById = async (id: string) => {
  const drill = await drillModel.findById(id).lean();
  if (!drill) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill not found');
  }

  const category = await drillCategoryModel.findById(drill.categoryId).lean();

  return {
    id: String(drill._id),
    name: drill.name,
    categoryId: String(drill.categoryId),
    category: category?.name || 'Unknown',
    description: drill.description,
    cover: drill.cover,
    accessLevel: drill.accessLevel,
    steps: drill.steps,
    equipment: drill.equipment,
    focusPoints: drill.focusPoints,
    createdAt: drill.createdAt,
  };
};

const save = async (
  id: string | undefined,
  payload: {
    name: string;
    categoryId: string;
    description: string;
    cover: string;
    accessLevel: 'free' | 'premium';
    steps?: string[];
    equipment?: string[];
    focusPoints?: string[];
  },
) => {
  const category = await drillCategoryModel.findById(payload.categoryId).lean();
  if (!category) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected drill category does not exist');
  }

  const next = {
    ...payload,
    steps: payload.steps || [],
    equipment: payload.equipment || [],
    focusPoints: payload.focusPoints || [],
  };

  const drill = id
    ? await drillModel.findByIdAndUpdate(id, next, { new: true, runValidators: true }).lean()
    : await drillModel.create(next).then((doc) => doc.toObject());

  if (!drill) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill not found');
  }

  return getById(String(drill._id));
};

const remove = async (id: string) => {
  const deleted = await drillModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill not found');
  }
};

export const drillService = {
  getAll,
  getById,
  save,
  remove,
};
