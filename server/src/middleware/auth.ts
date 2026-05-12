import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import env from '../config/env.js';
import { AppError } from '../utils/response.js';
import type { JwtPayload } from '../types/express.js';

export function signToken(payload: object): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as any);
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn } as any);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}

export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('未登录', 401, 401));
  try {
    req.user = jwt.verify(token, env.jwt.secret) as JwtPayload;
    next();
  } catch (err) {
    next(new AppError('登录已失效，请重新登录', 401, 401));
  }
}
