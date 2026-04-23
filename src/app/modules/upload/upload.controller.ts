import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';

import { uploadService } from './upload.service';

export const uploadController = {
  getProviderStatus: catchAsync(async (_req, res) => {
    const result = await uploadService.getProviderStatus();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Upload provider status fetched successfully',
      data: result,
    });
  }),
  createPresignedUpload: catchAsync(async (req, res) => {
    const result = await uploadService.createPresignedUpload(req.body);
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Upload URL generated successfully',
      data: result,
    });
  }),
  uploadFile: catchAsync(async (req, res) => {
    const result = await uploadService.uploadFile({
      file: (req as typeof req & { file?: Express.Multer.File }).file,
      folder: req.body.folder,
    });

    response.created(res, {
      message: 'File uploaded successfully',
      data: result,
    });
  }),
};
