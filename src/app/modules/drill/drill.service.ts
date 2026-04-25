import mongoose, { PipelineStage } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { buildPublicFileUrl } from '../../utils/fileUrl';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { drillCategoryModel } from '../drill-category/drill-category.model';

import { drillModel } from './drill.model';

const getAll = async (query: {
  page?: unknown;
  limit?: unknown;
  categoryId?: unknown;
  accessLevel?: unknown;
  search?: unknown;
} = {}) => {
  const { page, limit, skip } = getPagination(query);
  const categoryId = typeof query.categoryId === 'string' ? query.categoryId : '';
  const accessLevel = typeof query.accessLevel === 'string' ? query.accessLevel.toLowerCase() : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const matchStage: Record<string, unknown> = {};

  if (categoryId && categoryId !== 'all') {
    matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
  }

  if (accessLevel && accessLevel !== 'all') {
    matchStage.accessLevel = accessLevel === 'locked' ? 'premium' : accessLevel;
  }

  if (search) {
    matchStage.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const basePipeline: PipelineStage[] = [
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
        coverPhoto: '$cover',
        coverPhotoUrl: '$cover',
        drillName: '$name',
        steps: 1,
        equipment: 1,
        focusPoints: 1,
        createdAt: 1,
        updatedAt: 1,
        categoryName: '$category.name',
        category: {
          id: '$category._id',
          categoryName: '$category.name',
          accessLevel: '$category.accessLevel',
        },
      },
    },
    { $sort: { createdAt: -1 as const } },
  ];

  const [drills, totalResult] = await Promise.all([
    drillModel.aggregate([...basePipeline, { $skip: skip }, { $limit: limit }]),
    drillModel.aggregate([...basePipeline, { $count: 'total' }]),
  ]);

  const items = drills.map((item) => {
    const coverUrl = buildPublicFileUrl(item.cover);

    return {
      ...item,
      id: String(item.id),
      categoryId: String(item.categoryId),
      cover: coverUrl,
      coverUrl,
      coverPhoto: coverUrl,
      coverPhotoUrl: coverUrl,
      imageUrl: coverUrl,
      isPremium: item.accessLevel === 'premium',
      isLocked: item.accessLevel === 'premium',
    };
  });

  return {
    items,
    pagination: buildPaginationMeta(page, limit, totalResult[0]?.total || 0),
  };
};

const getById = async (id: string) => {
  const drill = await drillModel.findById(id).lean();
  if (!drill) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill not found');
  }

  const category = await drillCategoryModel.findById(drill.categoryId).lean();
  const coverUrl = buildPublicFileUrl(drill.cover);

  return {
    id: String(drill._id),
    name: drill.name,
    drillName: drill.name,
    categoryId: String(drill.categoryId),
    category: category
      ? {
          id: String(category._id),
          categoryName: category.name,
          accessLevel: category.accessLevel,
        }
      : null,
    categoryName: category?.name || 'Unknown',
    description: drill.description,
    cover: coverUrl,
    coverUrl,
    coverPhoto: coverUrl,
    coverPhotoUrl: coverUrl,
    imageUrl: coverUrl,
    accessLevel: drill.accessLevel,
    isPremium: drill.accessLevel === 'premium',
    isLocked: drill.accessLevel === 'premium',
    steps: drill.steps,
    equipment: drill.equipment,
    focusPoints: drill.focusPoints,
    createdAt: drill.createdAt,
    updatedAt: drill.updatedAt,
  };
};

const save = async (
  id: string | undefined,
  payload: {
    name?: string;
    drillName?: string;
    categoryId: string;
    description: string;
    cover?: string;
    coverPhoto?: string;
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
    name: payload.name || payload.drillName,
    categoryId: payload.categoryId,
    description: payload.description,
    cover: payload.cover || payload.coverPhoto,
    accessLevel: payload.accessLevel,
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
