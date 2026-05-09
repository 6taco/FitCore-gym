import { AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * 审计日志装饰器：attachAudit('system', 'user:create')
 * 在响应成功 (状态码 < 400) 后异步落库
 */
export function audit(module, action, options = {}) {
  return (req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      setImmediate(async () => {
        try {
          await AuditLog.create({
            user_id: req.user?.id,
            username: req.user?.username,
            module,
            action,
            target_type: options.targetType || null,
            target_id: options.targetId
              ? String(options.targetId(req, res))
              : (req.params?.id ? String(req.params.id) : null),
            detail: JSON.stringify({
              method: req.method,
              path: req.originalUrl,
              body: sanitize(req.body),
              query: req.query,
              duration_ms: Date.now() - startedAt,
            }),
            ip: req.ip,
          });
        } catch (err) {
          logger.warn(`写入操作日志失败: ${err.message}`);
        }
      });
    });
    next();
  };
}

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  ['password', 'oldPassword', 'newPassword', 'password_hash'].forEach((k) => {
    if (k in clone) clone[k] = '***';
  });
  return clone;
}
