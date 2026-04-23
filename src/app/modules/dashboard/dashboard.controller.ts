import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

import { dashboardService } from './dashboard.service';

export const dashboardController = {
  getOverview: catchAsync(async (_req, res) => {
    const result = await dashboardService.getOverview();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Dashboard overview fetched successfully',
      data: result,
    });
  }),
};
