import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

import { settingsService } from './settings.service';

export const settingsController = {
  getPublicAppSettings: catchAsync(async (_req, res) => {
    const result = await settingsService.getPublicAppSettings();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'App settings fetched successfully',
      data: result,
    });
  }),
  getLegalPages: catchAsync(async (_req, res) => {
    const result = await settingsService.getLegalPages();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Legal pages fetched successfully',
      data: result,
    });
  }),
  getAdminSettings: catchAsync(async (_req, res) => {
    const result = await settingsService.getAdminSettings();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Admin settings fetched successfully',
      data: result,
    });
  }),
  updateContentSection: catchAsync(async (req, res) => {
    await settingsService.updateContentSection(req.params.section as 'privacyPolicy' | 'terms' | 'aboutUs', req.body.value);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Content updated successfully',
    });
  }),
  updateAppSettings: catchAsync(async (req, res) => {
    const result = await settingsService.updateAppSettings(req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'App settings updated successfully',
      data: result,
    });
  }),
};
