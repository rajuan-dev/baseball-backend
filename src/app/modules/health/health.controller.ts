import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const getHealthStatus = catchAsync(async (_req, res) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
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
