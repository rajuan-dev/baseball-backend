import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

import { revenueCatService } from './revenuecat.service';

export const revenueCatController = {
  webhook: catchAsync(async (req, res) => {
    revenueCatService.verifyWebhookAuthorization(
      req.get(env.REVENUECAT_WEBHOOK_HEADER_NAME) ?? undefined,
    );

    const result = await revenueCatService.processWebhook(req.body);

    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'RevenueCat webhook processed successfully',
      data: result,
    });
  }),
};
