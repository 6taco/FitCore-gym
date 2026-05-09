import logger from '../utils/logger.js';
import { fail } from '../utils/response.js';

export function notFound(req, res) {
  res.status(404).json(fail(`路径不存在: ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const code = err.code || status;
  if (status >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${err.message}`);
  }
  res.status(status).json(fail(err.message || '服务器内部错误', code));
}
