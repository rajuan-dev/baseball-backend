import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { getSingleParam } from '../../utils/routeParam';
import { response } from '../../utils/sendResponse';

import { drillService } from './drill.service';

export const drillController = {
  getAll: catchAsync(async (req, res) => {
    const result = await drillService.getAll(req.query.categoryId as string | undefined);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Drills fetched successfully',
      data: result,
    });
  }),
  getById: catchAsync(async (req, res) => {
    const result = await drillService.getById(getSingleParam(req.params.id));
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Drill fetched successfully',
      data: result,
    });
  }),
  create: catchAsync(async (req, res) => {
    const result = await drillService.save(undefined, req.body);
    response.created(res, {
      message: 'Drill created successfully',
      data: result,
    });
  }),
  update: catchAsync(async (req, res) => {
    const result = await drillService.save(getSingleParam(req.params.id), req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Drill updated successfully',
      data: result,
    });
  }),
  remove: catchAsync(async (req, res) => {
    await drillService.remove(getSingleParam(req.params.id));
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Drill deleted successfully',
    });
  }),
};
