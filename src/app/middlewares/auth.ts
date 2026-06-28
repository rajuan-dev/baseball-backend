import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../errors/ApiError';
import { Admin } from '../modules/admin/admin.model';
import { appUserModel } from '../modules/auth/app-user.model';
import { tokenService } from '../services/token.service';

export type AuthPrincipal = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

type AuthenticatedRequest = Request & {
  authEntity?: Record<string, unknown>;
  user: AuthPrincipal;
};

const readBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice(7);
};

export const requireAuth = (role?: 'admin' | 'user') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const accessToken = readBearerToken(req);
    if (!accessToken) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authorization token is required'));
      return;
    }

    try {
      const decoded = tokenService.verifyToken(accessToken);

      if (role && decoded.role !== role) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not allowed to access this resource');
      }

      if (decoded.role === 'admin') {
        const admin = await Admin.findById(decoded.sub).lean();
        if (!admin || !admin.isActive) {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'Admin account is unavailable');
        }

        (req as AuthenticatedRequest).authEntity = admin as unknown as Record<string, unknown>;
      } else {
        const user = await appUserModel.findById(decoded.sub).lean();
        if (!user || !user.isActive) {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is unavailable');
        }

        (req as AuthenticatedRequest).authEntity = user as unknown as Record<string, unknown>;
      }

      (req as AuthenticatedRequest).user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(
        error instanceof ApiError
          ? error
          : new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'),
      );
    }
  };
};
