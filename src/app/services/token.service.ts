import jwt, { Secret, SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';

type TokenPayload = {
  sub: string;
  email: string;
  role: 'admin' | 'user';
};

const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET as Secret, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
};

const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const tokenService = {
  signToken,
  verifyToken,
};
