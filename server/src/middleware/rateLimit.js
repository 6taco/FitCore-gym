import { AppError } from '../utils/response.js';

/**
 * 简易内存限流中间件
 * @param {number} windowMs  时间窗口（毫秒）
 * @param {number} max       窗口内最大请求数
 */
export function rateLimit(windowMs = 60_000, max = 10) {
  const hits = new Map(); // key(ip) -> { count, resetTime }

  // 定时清理过期记录
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) {
      if (now > v.resetTime) hits.delete(k);
    }
  }, windowMs);

  return (req, _res, next) => {
    const key = req.ip;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      return next(new AppError('请求过于频繁，请稍后再试', 429));
    }
    next();
  };
}
