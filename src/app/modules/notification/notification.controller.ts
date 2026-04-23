import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

import { notificationService } from './notification.service';

export const notificationController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await notificationService.getAll();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Notifications fetched successfully',
      data: result,
    });
  }),
};
