import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

import { notificationService } from './notification.service';

export const notificationController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await notificationService.getAll();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notifications fetched successfully',
      data: result,
    });
  }),
};
