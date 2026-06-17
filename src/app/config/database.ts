import { Resolver, resolveSrv } from 'node:dns/promises';
import mongoose from 'mongoose';

import { env } from './env';
import { logger } from '../logger';

const SRV_RECOVERY_ERROR_CODES = new Set(['ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND', 'ETIMEOUT']);

const getMongoSrvLookupName = (uri: string): string | null => {
  if (!uri.startsWith('mongodb+srv://')) {
    return null;
  }

  try {
    const hostname = new URL(uri).hostname;

    return hostname ? `_mongodb._tcp.${hostname}` : null;
  } catch {
    return null;
  }
};

const isRecoverableSrvError = (error: unknown): error is NodeJS.ErrnoException => {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = (error as NodeJS.ErrnoException).code;

  return Boolean(code && SRV_RECOVERY_ERROR_CODES.has(code));
};

const getFallbackMongoUri = async (uri: string): Promise<string | null> => {
  const srvLookupName = getMongoSrvLookupName(uri);

  if (!srvLookupName) {
    return null;
  }

  try {
    await resolveSrv(srvLookupName);
    return null;
  } catch (error) {
    if (!isRecoverableSrvError(error) || env.MONGODB_DNS_FALLBACK_SERVERS.length === 0) {
      throw error;
    }

    const resolver = new Resolver();
    resolver.setServers(env.MONGODB_DNS_FALLBACK_SERVERS);

    try {
      const parsedUri = new URL(uri);
      const srvRecords = await resolver.resolveSrv(srvLookupName);
      const txtRecords = await resolver.resolveTxt(parsedUri.hostname).catch(
        (txtError: NodeJS.ErrnoException) => {
          if (txtError.code === 'ENODATA' || txtError.code === 'ENOTFOUND') {
            return [];
          }

          throw txtError;
        },
      );
      const mergedSearchParams = new URLSearchParams(parsedUri.search);

      for (const record of txtRecords) {
        for (const entry of record) {
          const txtParams = new URLSearchParams(entry);

          for (const [key, value] of txtParams.entries()) {
            if (!mergedSearchParams.has(key)) {
              mergedSearchParams.set(key, value);
            }
          }
        }
      }

      // mongodb+srv implies TLS unless explicitly disabled, so preserve that when
      // we synthesize a standard mongodb:// URI from fallback DNS results.
      if (!mergedSearchParams.has('tls') && !mergedSearchParams.has('ssl')) {
        mergedSearchParams.set('tls', 'true');
      }

      const hostList = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');
      const credentials =
        parsedUri.username || parsedUri.password
          ? `${parsedUri.username}${parsedUri.password ? `:${parsedUri.password}` : ''}@`
          : '';
      const pathname = parsedUri.pathname || '/';
      const query = mergedSearchParams.toString();
      const resolvedUri = `mongodb://${credentials}${hostList}${pathname}${query ? `?${query}` : ''}`;

      logger.warn('MongoDB SRV lookup failed with system DNS, using fallback DNS servers', {
        srvLookupName,
        fallbackServers: env.MONGODB_DNS_FALLBACK_SERVERS,
        error: error.message,
      });

      return resolvedUri;
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
};

export const connectDatabase = async (): Promise<void> => {
  const connectionUri = (await getFallbackMongoUri(env.MONGODB_URI)) ?? env.MONGODB_URI;
  await mongoose.connect(connectionUri);

  logger.info('MongoDB connected');
};
