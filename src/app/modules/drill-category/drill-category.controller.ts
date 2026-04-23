import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { getSingleParam } from '../../utils/routeParam';
import { sendResponse } from '../../utils/sendResponse';

import { drillCategoryService } from './drill-category.service';

export const drillCategoryController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await drillCategoryService.getAll();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drill categories fetched successfully',
      data: result,
    });
  }),
  getById: catchAsync(async (req, res) => {
    const result = await drillCategoryService.getById(getSingleParam(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drill category fetched successfully',
      data: result,
    });
  }),
  create: catchAsync(async (req, res) => {
    const result = await drillCategoryService.save(undefined, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Drill category created successfully',
      data: result,
    });
  }),
  update: catchAsync(async (req, res) => {
    const result = await drillCategoryService.save(getSingleParam(req.params.id), req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drill category updated successfully',
      data: result,
    });
  }),
  remove: catchAsync(async (req, res) => {
    await drillCategoryService.remove(getSingleParam(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Drill category deleted successfully',
    });
  }),
};
