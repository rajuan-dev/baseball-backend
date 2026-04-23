import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

import { settingsService } from './settings.service';

export const settingsController = {
  getPublicAppSettings: catchAsync(async (_req, res) => {
    const result = await settingsService.getPublicAppSettings();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'App settings fetched successfully',
      data: result,
    });
  }),
  getLegalPages: catchAsync(async (_req, res) => {
    const result = await settingsService.getLegalPages();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Legal pages fetched successfully',
      data: result,
    });
  }),
  getAdminSettings: catchAsync(async (_req, res) => {
    const result = await settingsService.getAdminSettings();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin settings fetched successfully',
      data: result,
    });
  }),
  updateContentSection: catchAsync(async (req, res) => {
    await settingsService.updateContentSection(req.params.section as 'privacyPolicy' | 'terms' | 'aboutUs', req.body.value);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Content updated successfully',
    });
  }),
  updateAppSettings: catchAsync(async (req, res) => {
    const result = await settingsService.updateAppSettings(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'App settings updated successfully',
      data: result,
    });
  }),
};
