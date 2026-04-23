import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

const getHealthStatus = catchAsync(async (_req, res) => {
  response.success(res, {
    statusCode: StatusCodes.OK,
    message: 'Backend is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export const healthController = {
  getHealthStatus,
};
