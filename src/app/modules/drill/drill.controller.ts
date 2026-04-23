import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { getSingleParam } from '../../utils/routeParam';
import { sendResponse } from '../../utils/sendResponse';

import { drillService } from './drill.service';

export const drillController = {
  getAll: catchAsync(async (req, res) => {
    const result = await drillService.getAll(req.query.categoryId as string | undefined);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drills fetched successfully',
      data: result,
    });
  }),
  getById: catchAsync(async (req, res) => {
    const result = await drillService.getById(getSingleParam(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drill fetched successfully',
      data: result,
    });
  }),
  create: catchAsync(async (req, res) => {
    const result = await drillService.save(undefined, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Drill created successfully',
      data: result,
    });
  }),
  update: catchAsync(async (req, res) => {
    const result = await drillService.save(getSingleParam(req.params.id), req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drill updated successfully',
      data: result,
    });
  }),
  remove: catchAsync(async (req, res) => {
    await drillService.remove(getSingleParam(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drill deleted successfully',
    });
  }),
};
