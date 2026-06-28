import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { buildPublicFileUrl } from '../../utils/fileUrl';
import { response } from '../../utils/sendResponse';

import { adminService } from './admin.service';

export const adminController = {
  createAdmin: catchAsync(async (req, res) => {
    const result = await adminService.createAdmin(req.body);
    response.created(res, {
      message: 'Admin created successfully',
      data: result,
    });
  }),
  getProfile: catchAsync(async (req, res) => {
    const request = req as typeof req & {
      authEntity?: Record<string, unknown>;
      user: { id: string; role?: string };
    };
    const principal = request.user;
    const cachedAdmin = request.authEntity;
    const result =
      principal.role === 'admin' && cachedAdmin
        ? {
            id: String(cachedAdmin._id),
            name: String(cachedAdmin.name ?? ''),
            email: String(cachedAdmin.email ?? ''),
            role: 'Super Admin',
            image: buildPublicFileUrl(typeof cachedAdmin.image === 'string' ? cachedAdmin.image : ''),
            contactNo: String(cachedAdmin.contactNo ?? ''),
          }
        : await adminService.getProfile(principal.id);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Admin profile fetched successfully',
      data: result,
    });
  }),
  updateProfile: catchAsync(async (req, res) => {
    const principal = (req as typeof req & { user: { id: string } }).user;
    const result = await adminService.updateProfile(principal.id, req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Admin profile updated successfully',
      data: result,
    });
  }),
  changePassword: catchAsync(async (req, res) => {
    const principal = (req as typeof req & { user: { id: string } }).user;
    await adminService.changePassword(principal.id, req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Password changed successfully',
    });
  }),
};
