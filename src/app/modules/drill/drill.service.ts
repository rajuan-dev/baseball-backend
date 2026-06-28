import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { storageService } from '../../services/storage.service';
import { buildPublicFileUrl } from '../../utils/fileUrl';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { drillCategoryModel } from '../drill-category/drill-category.model';

import { drillModel } from './drill.model';
import { normalizeYouTubeUrl } from './drill.youtube';

const buildDrillMatch = (query: {
  categoryId?: unknown;
  accessLevel?: unknown;
  search?: unknown;
}) => {
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

  return matchStage;
};

const mapDrillListItem = (item: Record<string, unknown>) => {
  const rawCategory =
    item.categoryId && typeof item.categoryId === 'object'
      ? (item.categoryId as Record<string, unknown>)
      : null;
  const resolvedCategoryId = rawCategory?._id ?? item.categoryId;
  const coverUrl = buildPublicFileUrl(typeof item.cover === 'string' ? item.cover : undefined);
  const focusPoints = normalizeFocusPoints(item.focusPoints as DrillFocusPointInput[] | undefined);
  const equipment = normalizeEquipment(item.equipment as DrillEquipmentInput[] | undefined);

  return {
    id: String(item._id),
    name: item.name,
    categoryId: String(resolvedCategoryId),
    description: item.description,
    cover: coverUrl,
    youtubeUrl: item.youtubeUrl || null,
    listIcon: item.listIcon || 'baseball-outline',
    accessLevel: item.accessLevel,
    coverUrl,
    coverPhoto: coverUrl,
    coverPhotoUrl: coverUrl,
    imageUrl: coverUrl,
    isPremium: item.accessLevel === 'premium',
    isLocked: item.accessLevel === 'premium',
    drillName: item.name,
    steps: Array.isArray(item.steps) ? item.steps : [],
    equipment,
    focusPoints,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    categoryName: typeof rawCategory?.name === 'string' ? rawCategory.name : '',
    category: rawCategory
      ? {
          id: String(rawCategory._id),
          categoryName: rawCategory.name,
          accessLevel: rawCategory.accessLevel,
        }
      : null,
  };
};

type DrillFocusPointInput = string | { title?: string; description?: string };
type DrillEquipmentInput = string | { name?: string; link?: string };

const getAll = async (query: {
  page?: unknown;
  limit?: unknown;
  categoryId?: unknown;
  accessLevel?: unknown;
  search?: unknown;
} = {}) => {
  const { page, limit, skip } = getPagination(query);
  const matchStage = buildDrillMatch(query);

  const [drills, totalResult] = await Promise.all([
    drillModel
      .find(matchStage)
      .sort({ createdAt: -1 as const })
      .skip(skip)
      .limit(limit)
      .select('name categoryId description cover youtubeUrl listIcon accessLevel steps equipment focusPoints createdAt updatedAt')
      .populate({ path: 'categoryId', select: 'name accessLevel', options: { lean: true } })
      .lean(),
    drillModel.countDocuments(matchStage),
  ]);
  const items = drills.map((item) => mapDrillListItem(item as unknown as Record<string, unknown>));

  return {
    items,
    pagination: buildPaginationMeta(page, limit, totalResult),
  };
};

const normalizeFocusPoints = (items?: DrillFocusPointInput[]) =>
  (items || [])
    .map((item) => {
      if (typeof item === 'string') {
        const [title = '', ...rest] = item.split(':');

        return {
          title: title.trim(),
          description: rest.join(':').trim(),
        };
      }

      return {
        title: (item.title || '').trim(),
        description: (item.description || '').trim(),
      };
    })
    .filter((item) => item.title || item.description);


const normalizeEquipment = (items?: DrillEquipmentInput[]) =>
  (items || [])
    .map((item) => {
      if (typeof item === 'string') {
        return {
          name: item.trim(),
          link: null,
        };
      }

      return {
        name: (item.name || '').trim(),
        link: (item.link || '').trim() || null,
      };
    })
    .filter((item) => item.name);


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
    youtubeUrl: drill.youtubeUrl || null,
    listIcon: drill.listIcon || 'baseball-outline',
    coverUrl,
    coverPhoto: coverUrl,
    coverPhotoUrl: coverUrl,
    imageUrl: coverUrl,
    accessLevel: drill.accessLevel,
    isPremium: drill.accessLevel === 'premium',
    isLocked: drill.accessLevel === 'premium',
    steps: drill.steps,
    equipment: normalizeEquipment(drill.equipment),
    focusPoints: normalizeFocusPoints(drill.focusPoints),
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
    youtubeUrl?: string | null;
    listIcon?: string;
    accessLevel: 'free' | 'premium';
    steps?: string[];
    equipment?: string[];
    focusPoints?: Array<string | { title?: string; description?: string }>;
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
    youtubeUrl: normalizeYouTubeUrl(payload.youtubeUrl) || null,
    listIcon: payload.listIcon || 'baseball-outline',
    accessLevel: payload.accessLevel,
    steps: payload.steps || [],
    equipment: normalizeEquipment(payload.equipment),
    focusPoints: normalizeFocusPoints(payload.focusPoints),
  };

  const previousDrill = id ? await drillModel.findById(id).lean() : null;
  const drill = id
    ? await drillModel.findByIdAndUpdate(id, next, { new: true, runValidators: true }).lean()
    : await drillModel.create(next).then((doc) => doc.toObject());

  if (!drill) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill not found');
  }

  await storageService.deleteFileIfChanged(previousDrill?.cover, drill.cover);

  return getById(String(drill._id));
};

const remove = async (id: string) => {
  const deleted = await drillModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Drill not found');
  }

  await storageService.deleteFileIfChanged(deleted.cover, null);
};

export const drillService = {
  getAll,
  getById,
  save,
  remove,
};
