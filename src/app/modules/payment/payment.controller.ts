import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

import { paymentService } from './payment.service';

export const paymentController = {
  getAll: catchAsync(async (_req, res) => {
    const result = await paymentService.getAll();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Transactions fetched successfully',
      data: result,
    });
  }),
  completePurchase: catchAsync(async (req, res) => {
    const result = await paymentService.completePurchase(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Premium purchase completed successfully',
      data: result,
    });
  }),
  updatePrice: catchAsync(async (req, res) => {
    await paymentService.updatePrice(req.body.price);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Unlock price updated successfully',
    });
  }),
};
