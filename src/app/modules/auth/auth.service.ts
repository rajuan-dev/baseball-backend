import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { ApiError } from '../../errors/ApiError';
import { resendService } from '../../services/resend.service';
import { tokenService } from '../../services/token.service';
import { Admin } from '../admin/admin.model';

import { appUserModel } from './app-user.model';
import { otpModel } from './otp.model';

const createOtpCode = (): string => randomInt(1000, 10000).toString();

const createExpiryDate = (): Date =>
  new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000);

const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  if (!name || !domain) {
    return email;
  }

  return `${name.slice(0, 2)}***@${domain}`;
};

const issueOtp = async (email: string, purpose: 'app_login' | 'admin_reset') => {
  const normalizedEmail = email.toLowerCase();
  const code = createOtpCode();

  await otpModel.deleteMany({ email: normalizedEmail, purpose });
  await otpModel.create({
    email: normalizedEmail,
    code,
    purpose,
    expiresAt: createExpiryDate(),
  });

  await resendService.sendOtpEmail(normalizedEmail, code);

  return {
    email: normalizedEmail,
    maskedEmail: maskEmail(normalizedEmail),
    expiresInMinutes: env.OTP_EXPIRES_MINUTES,
  };
};

const sendAppOtp = async (email: string) => {
  await appUserModel.findOneAndUpdate(
    { email: email.toLowerCase() },
    { email: email.toLowerCase() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return issueOtp(email, 'app_login');
};

const verifyAppOtp = async (email: string, code: string) => {
  const normalizedEmail = email.toLowerCase();
  const otp = await otpModel.findOne({
    email: normalizedEmail,
    code,
    purpose: 'app_login',
    consumedAt: null,
  });

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired OTP code');
  }

  otp.consumedAt = new Date();
  await otp.save();

  const user = await appUserModel.findOneAndUpdate(
    { email: normalizedEmail },
    { email: normalizedEmail },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return {
    token: tokenService.signToken({
      sub: String(user!._id),
      email: normalizedEmail,
      role: 'user',
    }),
    user: {
      id: String(user!._id),
      email: normalizedEmail,
      isPremium: user?.isPremium ?? false,
      version: '2.4.0 Elite',
    },
  };
};

const loginAdmin = async (email: string, password: string) => {
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  if (!admin.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Admin account is unavailable');
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  return {
    token: tokenService.signToken({
      sub: String(admin._id),
      email: admin.email,
      role: 'admin',
    }),
    user: {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: 'Super Admin',
    },
  };
};

const sendAdminResetOtp = async (email: string) => {
  const admin = await Admin.findOne({ email: email.toLowerCase() }).lean();
  if (!admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No admin found with this email');
  }

  return issueOtp(email, 'admin_reset');
};

const verifyAdminResetOtp = async (email: string, code: string) => {
  const otp = await otpModel.findOne({
    email: email.toLowerCase(),
    code,
    purpose: 'admin_reset',
    consumedAt: null,
  }).lean();

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired OTP code');
  }

  return true;
};

const resetAdminPassword = async (email: string, newPassword: string) => {
  const otp = await otpModel.findOne({
    email: email.toLowerCase(),
    purpose: 'admin_reset',
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP verification is required first');
  }

  otp.consumedAt = new Date();
  await otp.save();

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No admin found with this email');
  }

  admin.password = newPassword;
  await admin.save();
};

const getAppUserProfile = async (userId: string) => {
  const user = await appUserModel.findById(userId).lean();
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return {
    email: user.email,
    isPremium: user.isPremium,
    version: '2.4.0 Elite',
  };
};

export const authService = {
  sendAppOtp,
  verifyAppOtp,
  loginAdmin,
  sendAdminResetOtp,
  verifyAdminResetOtp,
  resetAdminPassword,
  getAppUserProfile,
};
