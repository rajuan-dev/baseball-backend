import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { getSingleParam } from '../../utils/routeParam';
import { response } from '../../utils/sendResponse';

import { situationService } from './situation.service';

export const situationController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await situationService.getAll();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Situations fetched successfully',
      data: result,
    });
  }),
  getById: catchAsync(async (req, res) => {
    const result = await situationService.getById(getSingleParam(req.params.id));
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Situation fetched successfully',
      data: result,
    });
  }),
  create: catchAsync(async (req, res) => {
    const result = await situationService.save(undefined, req.body);
    response.created(res, {
      message: 'Situation created successfully',
      data: result,
    });
  }),
  update: catchAsync(async (req, res) => {
    const result = await situationService.save(getSingleParam(req.params.id), req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Situation updated successfully',
      data: result,
    });
  }),
};
