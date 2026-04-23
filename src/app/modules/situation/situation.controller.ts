import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { getSingleParam } from '../../utils/routeParam';
import { sendResponse } from '../../utils/sendResponse';

import { situationService } from './situation.service';

export const situationController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await situationService.getAll();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Situations fetched successfully',
      data: result,
    });
  }),
  getById: catchAsync(async (req, res) => {
    const result = await situationService.getById(getSingleParam(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Situation fetched successfully',
      data: result,
    });
  }),
  create: catchAsync(async (req, res) => {
    const result = await situationService.save(undefined, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Situation created successfully',
      data: result,
    });
  }),
  update: catchAsync(async (req, res) => {
    const result = await situationService.save(getSingleParam(req.params.id), req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Situation updated successfully',
      data: result,
    });
  }),
};
