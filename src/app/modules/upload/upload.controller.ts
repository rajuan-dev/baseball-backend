import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

import { uploadService } from './upload.service';

export const uploadController = {
  createPresignedUpload: catchAsync(async (req, res) => {
    const result = await uploadService.createPresignedUpload(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Upload URL generated successfully',
      data: result,
    });
  }),
};
