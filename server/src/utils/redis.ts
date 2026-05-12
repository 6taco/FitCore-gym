import Redis from 'ioredis';
import env from '../config/env.js';
import logger from './logger.js';

const redis = new (Redis as any)({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
  db: env.redis.db,
  retryStrategy(times: number) {
    if (times > 10) return null;
    return Math.min(times * 200, 3000);
  },
  lazyConnect: true,
});

let connected = false;

redis.on('connect', () => {
  connected = true;
  logger.info(`[Redis] connected to ${env.redis.host}:${env.redis.port}`);
});

redis.on('error', (err: Error) => {
  connected = false;
  logger.warn(`[Redis] connection error: ${err.message}`);
});

redis.on('close', () => {
  connected = false;
});

/**
 * 尝试连接 Redis；连接失败不会阻塞应用启动，
 * 后续操作会自动降级到数据库 / 内存。
 */
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (err) {
    logger.warn(`[Redis] initial connect failed, falling back to in-memory: ${(err as Error).message}`);
  }
}

/** 是否可用 */
export function isRedisReady(): boolean {
  return connected && redis.status === 'ready';
}

export default redis;
