import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { getSingleParam } from '../../utils/routeParam';
import { sendResponse } from '../../utils/sendResponse';

import { reportService } from './report.service';

export const reportController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await reportService.getAll();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Reports fetched successfully',
      data: result,
    });
  }),
  getById: catchAsync(async (req, res) => {
    const result = await reportService.getById(getSingleParam(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Report fetched successfully',
      data: result,
    });
  }),
  create: catchAsync(async (req, res) => {
    const result = await reportService.create(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Support report submitted successfully',
      data: result,
    });
  }),
};
