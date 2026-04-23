import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { authService } from '../auth/auth.service';

export const authController = {
  sendAppOtp: catchAsync(async (req, res) => {
    const result = await authService.sendAppOtp(req.body.email);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'OTP sent successfully',
      data: result,
    });
  }),
  verifyAppOtp: catchAsync(async (req, res) => {
    const result = await authService.verifyAppOtp(req.body.email, req.body.code);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'OTP verified successfully',
      data: result,
    });
  }),
  loginAdmin: catchAsync(async (req, res) => {
    const result = await authService.loginAdmin(req.body.email, req.body.password);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin login successful',
      data: result,
    });
  }),
  forgotAdminPassword: catchAsync(async (req, res) => {
    const result = await authService.sendAdminResetOtp(req.body.email);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Reset OTP sent successfully',
      data: result,
    });
  }),
  verifyAdminOtp: catchAsync(async (req, res) => {
    const result = await authService.verifyAdminResetOtp(req.body.email, req.body.code);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'OTP verified successfully',
      data: result,
    });
  }),
  resetAdminPassword: catchAsync(async (req, res) => {
    await authService.resetAdminPassword(req.body.email, req.body.newPassword);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Password reset successful',
    });
  }),
  getAppMe: catchAsync(async (req, res) => {
    const principal = (req as typeof req & { user: { id: string } }).user;
    const result = await authService.getAppUserProfile(principal.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'App user profile fetched successfully',
      data: result,
    });
  }),
};
