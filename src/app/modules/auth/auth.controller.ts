import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { authService } from '../auth/auth.service';

export const authController = {
  sendAppOtp: catchAsync(async (req, res) => {
    const result = await authService.sendAppOtp(req.body.email);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'OTP sent successfully',
      data: result,
    });
  }),
  verifyAppOtp: catchAsync(async (req, res) => {
    const result = await authService.verifyAppOtp(req.body.email, req.body.code);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'OTP verified successfully',
      data: result,
    });
  }),
  loginAdmin: catchAsync(async (req, res) => {
    const result = await authService.loginAdmin(req.body.email, req.body.password);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Admin login successful',
      data: result,
    });
  }),
  forgotAdminPassword: catchAsync(async (req, res) => {
    const result = await authService.sendAdminResetOtp(req.body.email);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Reset OTP sent successfully',
      data: result,
    });
  }),
  verifyAdminOtp: catchAsync(async (req, res) => {
    const result = await authService.verifyAdminResetOtp(req.body.email, req.body.code);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'OTP verified successfully',
      data: result,
    });
  }),
  resetAdminPassword: catchAsync(async (req, res) => {
    await authService.resetAdminPassword(req.body.email, req.body.newPassword);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Password reset successful',
    });
  }),
  getAppMe: catchAsync(async (req, res) => {
    const principal = (req as typeof req & { user: { id: string } }).user;
    const result = await authService.getAppUserProfile(principal.id);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'App user profile fetched successfully',
      data: result,
    });
  }),
};
