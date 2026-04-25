import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';

import { reportModel } from './report.model';

const mapReport = (item: Record<string, unknown>) => ({
  id: String(item._id),
  user: item.user,
  userId: item.userId ?? null,
  fullName: item.user,
  email: item.email,
  phone: item.phone,
  city: item.city,
  title: item.title,
  status: item.status,
  message: item.message,
  details: item.message,
  joinDate: item.createdAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  resolvedAt: item.resolvedAt,
});

const normalizeStatus = (status?: string) => {
  if (!status || status.toLowerCase() === 'all') return undefined;
  return status.toLowerCase() === 'resolved' ? 'Resolved' : 'Open';
};

const getAll = async (query: {
  page?: unknown;
  limit?: unknown;
  status?: unknown;
  city?: unknown;
  search?: unknown;
} = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  const status = normalizeStatus(typeof query.status === 'string' ? query.status : undefined);
  const city = typeof query.city === 'string' ? query.city : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  if (status) filter.status = status;
  if (city && city.toLowerCase() !== 'all') filter.city = city;
  if (search) {
    filter.$or = [
      { user: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  const [reports, total] = await Promise.all([
    reportModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    reportModel.countDocuments(filter),
  ]);

  return {
    items: reports.map((item) => mapReport(item as unknown as Record<string, unknown>)),
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getById = async (id: string) => {
  const report = await reportModel.findById(id).lean();
  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');
  }

  return mapReport(report as unknown as Record<string, unknown>);
};

const create = async (payload: {
  user?: string;
  email: string;
  phone?: string;
  city?: string;
  title: string;
  message: string;
}) => {
  const report = await reportModel.create({
    user: payload.user || 'Mobile User',
    email: payload.email.toLowerCase(),
    phone: payload.phone || '',
    city: payload.city || 'Marietta',
    title: payload.title,
    status: 'Open',
    message: payload.message,
  });

  return mapReport(report.toObject() as unknown as Record<string, unknown>);
};

const updateStatus = async (id: string, status: 'Open' | 'Resolved') => {
  const report = await reportModel.findByIdAndUpdate(
    id,
    {
      status,
      resolvedAt: status === 'Resolved' ? new Date() : null,
    },
    { new: true, runValidators: true },
  ).lean();

  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');
  }

  return mapReport(report as unknown as Record<string, unknown>);
};

export const reportService = {
  getAll,
  getById,
  create,
  updateStatus,
};
