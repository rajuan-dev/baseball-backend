import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';
import { env } from '../../config/env';
import { logger } from '../../logger';
import { storageService } from '../../services/storage.service';
import { buildPublicFileUrl } from '../../utils/fileUrl';

import { Admin } from './admin.model';

const seedDefaultAdmin = async (): Promise<void> => {
  const existingAdmin = await Admin.findOne({
    email: env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
  });

  if (existingAdmin) {
    const needsUpdate =
      existingAdmin.name !== env.DEFAULT_ADMIN_NAME ||
      existingAdmin.role !== 'super_admin' ||
      existingAdmin.isActive !== true ||
      !existingAdmin.contactNo;

    if (needsUpdate) {
      existingAdmin.name = env.DEFAULT_ADMIN_NAME;
      existingAdmin.role = 'super_admin';
      existingAdmin.isActive = true;
      existingAdmin.contactNo = existingAdmin.contactNo || '+1 222 333 4444';
      await existingAdmin.save();
    }

    logger.info('Admin seed skipped', {
      email: env.DEFAULT_ADMIN_EMAIL,
    });
    return;
  }

  await Admin.create({
    name: env.DEFAULT_ADMIN_NAME,
    email: env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
    password: env.DEFAULT_ADMIN_PASSWORD,
    role: 'super_admin',
    contactNo: '+1 222 333 4444',
  });

  logger.info('Default admin created', {
    email: env.DEFAULT_ADMIN_EMAIL,
  });
};

const createAdmin = async (payload: {
  name: string;
  email: string;
  password: string;
  image: string;
  contactNo: string;
}) => {
  const exists = await Admin.isAdminExistsByEmail(payload.email);
  if (exists) {
    throw new ApiError(StatusCodes.CONFLICT, 'Admin already exists with this email');
  }

  const admin = await Admin.create({
    ...payload,
    email: payload.email.toLowerCase(),
    role: 'super_admin',
  });

  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: 'Super Admin',
    image: buildPublicFileUrl(admin.image),
    contactNo: admin.contactNo || '',
  };
};

const getProfile = async (adminId: string) => {
  const admin = await Admin.findById(adminId).lean();
  if (!admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Admin profile not found');
  }

  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: 'Super Admin',
    image: buildPublicFileUrl(admin.image),
    contactNo: admin.contactNo || '',
  };
};

const updateProfile = async (
  adminId: string,
  payload: {
    name: string;
    email: string;
    image: string;
    contactNo: string;
  },
) => {
  const existing = await Admin.findOne({
    _id: { $ne: adminId },
    email: payload.email.toLowerCase(),
  }).lean();

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Another admin already uses this email');
  }

  const previousAdmin = await Admin.findById(adminId).lean();
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    {
      ...payload,
      email: payload.email.toLowerCase(),
    },
    { new: true, runValidators: true },
  ).lean();

  if (!admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Admin profile not found');
  }

  await storageService.deleteFileIfChanged(previousAdmin?.image, admin.image);

  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: 'Super Admin',
    image: buildPublicFileUrl(admin.image),
    contactNo: admin.contactNo || '',
  };
};

const changePassword = async (
  adminId: string,
  payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
    confirmNewPassword?: string;
  },
) => {
  const confirmation = payload.confirmPassword ?? payload.confirmNewPassword;
  if (confirmation && confirmation !== payload.newPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Passwords do not match');
  }

  const admin = await Admin.findById(adminId).select('+password');
  if (!admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Admin profile not found');
  }

  const isMatch = await bcrypt.compare(payload.currentPassword, admin.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  admin.password = payload.newPassword;
  await admin.save();
};

export const adminService = {
  seedDefaultAdmin,
  createAdmin,
  getProfile,
  updateProfile,
  changePassword,
};
