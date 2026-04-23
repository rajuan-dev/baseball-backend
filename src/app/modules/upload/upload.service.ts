import { randomUUID } from 'node:crypto';

import { s3Service } from '../../services/s3.service';

const createPresignedUpload = async (payload: {
  fileName: string;
  contentType: string;
  folder?: string;
}) => {
  const extension = payload.fileName.includes('.')
    ? payload.fileName.split('.').pop()
    : 'jpg';
  const key = `${payload.folder || 'general'}/${randomUUID()}.${extension}`;
  const uploadUrl = await s3Service.getUploadUrl(key, payload.contentType);

  return {
    uploadUrl,
    fileUrl: s3Service.getPublicUrl(key),
    key,
  };
};

export const uploadService = {
  createPresignedUpload,
};
