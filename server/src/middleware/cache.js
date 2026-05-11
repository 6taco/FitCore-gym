import redis, { isRedisReady } from '../utils/redis.js';

const CACHE_PREFIX = 'cache:';

/**
 * 接口级 Redis 缓存中间件
 * @param {number} ttl  缓存时间（秒），默认 5 分钟
 */
export function apiCache(ttl = 300) {
  return async (req, res, next) => {
    if (!isRedisReady()) return next();

    const key = `${CACHE_PREFIX}${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch {
      return next();
    }

    // 拦截 res.json，写入缓存后再发送
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200 && isRedisReady()) {
        redis.set(key, JSON.stringify(body), 'EX', ttl).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}
