import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { getSingleParam } from '../../utils/routeParam';
import { response } from '../../utils/sendResponse';

import { reportService } from './report.service';

export const reportController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await reportService.getAll();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Reports fetched successfully',
      data: result,
    });
  }),
  getById: catchAsync(async (req, res) => {
    const result = await reportService.getById(getSingleParam(req.params.id));
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Report fetched successfully',
      data: result,
    });
  }),
  create: catchAsync(async (req, res) => {
    const result = await reportService.create(req.body);
    response.created(res, {
      message: 'Support report submitted successfully',
      data: result,
    });
  }),
};
