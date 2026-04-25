import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

import { paymentService } from './payment.service';

export const paymentController = {
  getAll: catchAsync(async (req, res) => {
    const result = await paymentService.getAll(req.query);
    response.paginated(res, {
      statusCode: StatusCodes.OK,
      message: 'Transactions fetched successfully',
      data: {
        fullUnlockPrice: result.fullUnlockPrice,
        transactions: result.transactions,
      },
      meta: { pagination: result.pagination },
    });
  }),
  getSummary: catchAsync(async (_req, res) => {
    const result = await paymentService.getSummary();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Earnings summary fetched successfully',
      data: result,
    });
  }),
  completePurchase: catchAsync(async (req, res) => {
    const result = await paymentService.completePurchase(req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Premium purchase completed successfully',
      data: result,
    });
  }),
  updatePrice: catchAsync(async (req, res) => {
    await paymentService.updatePrice(req.body.price);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Unlock price updated successfully',
    });
  }),
};
