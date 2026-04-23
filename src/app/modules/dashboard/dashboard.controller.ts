import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

import { dashboardService } from './dashboard.service';

export const dashboardController = {
  getOverview: catchAsync(async (_req, res) => {
    const result = await dashboardService.getOverview();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Dashboard overview fetched successfully',
      data: result,
    });
  }),
};
