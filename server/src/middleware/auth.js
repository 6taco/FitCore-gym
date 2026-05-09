import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from '../utils/response.js';

export function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

export function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('未登录', 401, 401));
  try {
    req.user = jwt.verify(token, env.jwt.secret);
    next();
  } catch (err) {
    next(new AppError('登录已失效，请重新登录', 401, 401));
  }
}
