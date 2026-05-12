import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response.js';
import redis, { isRedisReady } from '../utils/redis.js';

const RATE_PREFIX = 'rl:';

/**
 * 限流中间件（Redis 优先，内存降级）
 * @param windowMs  时间窗口（毫秒）
 * @param max       窗口内最大请求数
 */
export function rateLimit(windowMs = 60_000, max = 10) {
  const windowSec = Math.ceil(windowMs / 1000);

  // —— 内存降级方案 ——
  const hits = new Map<string, { count: number; resetTime: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) {
      if (now > v.resetTime) hits.delete(k);
    }
  }, windowMs);

  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';

    // —— Redis 可用时使用 INCR + EXPIRE ——
    if (isRedisReady()) {
      try {
        const key = `${RATE_PREFIX}${ip}:${Math.floor(Date.now() / windowMs)}`;
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, windowSec);
        if (count > max) {
          return next(new AppError('请求过于频繁，请稍后再试', 429));
        }
        return next();
      } catch {
        // Redis 异常时降级到内存
      }
    }

    // —— 内存降级 ——
    const now = Date.now();
    let entry = hits.get(ip);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      return next(new AppError('请求过于频繁，请稍后再试', 429));
    }
    next();
  };
}
