import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

import { adminService } from './admin.service';

export const adminController = {
  createAdmin: catchAsync(async (req, res) => {
    const result = await adminService.createAdmin(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Admin created successfully',
      data: result,
    });
  }),
  getProfile: catchAsync(async (req, res) => {
    const principal = (req as typeof req & { user: { id: string } }).user;
    const result = await adminService.getProfile(principal.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin profile fetched successfully',
      data: result,
    });
  }),
  updateProfile: catchAsync(async (req, res) => {
    const principal = (req as typeof req & { user: { id: string } }).user;
    const result = await adminService.updateProfile(principal.id, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin profile updated successfully',
      data: result,
    });
  }),
  changePassword: catchAsync(async (req, res) => {
    const principal = (req as typeof req & { user: { id: string } }).user;
    await adminService.changePassword(principal.id, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Password changed successfully',
    });
  }),
};
