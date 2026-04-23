import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';

import { reportModel } from './report.model';

const getAll = async () => {
  const reports = await reportModel.find().sort({ createdAt: -1 }).lean();
  return reports.map((item) => ({
    id: String(item._id),
    user: item.user,
    email: item.email,
    phone: item.phone,
    city: item.city,
    title: item.title,
    status: item.status,
    message: item.message,
    createdAt: item.createdAt,
  }));
};

const getById = async (id: string) => {
  const report = await reportModel.findById(id).lean();
  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');
  }

  return {
    id: String(report._id),
    user: report.user,
    email: report.email,
    phone: report.phone,
    city: report.city,
    title: report.title,
    status: report.status,
    message: report.message,
    createdAt: report.createdAt,
  };
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

  return {
    id: String(report._id),
    user: report.user,
    email: report.email,
    phone: report.phone,
    city: report.city,
    title: report.title,
    status: report.status,
    message: report.message,
    createdAt: report.createdAt,
  };
};

export const reportService = {
  getAll,
  getById,
  create,
};
