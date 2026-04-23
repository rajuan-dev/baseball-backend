import path from 'node:path';

import { env } from './env';

export const appRoot = path.resolve(__dirname, '../../..');
export const localUploadsRoot = path.resolve(appRoot, env.LOCAL_UPLOADS_DIR);
