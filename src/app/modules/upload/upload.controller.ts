import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

import { uploadService } from './upload.service';

export const uploadController = {
  createPresignedUpload: catchAsync(async (req, res) => {
    const result = await uploadService.createPresignedUpload(req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Upload URL generated successfully',
      data: result,
    });
  }),
};
