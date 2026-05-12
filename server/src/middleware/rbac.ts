import { Request, Response, NextFunction } from 'express';
import { Role, Permission } from '../models/index.js';
import { AppError } from '../utils/response.js';
import redis, { isRedisReady } from '../utils/redis.js';

const PERM_PREFIX = 'perm:';
const PERM_TTL = 30 * 60; // 30 分钟

// 内存降级缓存（Redis 不可用时使用）
const memCache = new Map<number, Set<string>>();
let memCacheAt = 0;
const MEM_TTL = 60 * 1000;

async function loadPermissions(roleId: number): Promise<Set<string>> {
  // —— Redis 可用时优先走 Redis ——
  if (isRedisReady()) {
    const key = `${PERM_PREFIX}${roleId}`;
    const cached = await redis.get(key);
    if (cached) return new Set(JSON.parse(cached) as string[]);

    const role = await Role.findByPk(roleId, {
      include: [{ model: Permission, as: 'permissions', attributes: ['code'] }],
    });
    const codes = (role?.permissions || []).map((p) => p.code);
    await redis.set(key, JSON.stringify(codes), 'EX', PERM_TTL);
    return new Set(codes);
  }

  // —— Redis 不可用时降级到内存缓存 ——
  if (memCache.has(roleId) && Date.now() - memCacheAt < MEM_TTL) {
    return memCache.get(roleId)!;
  }
  const role = await Role.findByPk(roleId, {
    include: [{ model: Permission, as: 'permissions', attributes: ['code'] }],
  });
  const set = new Set((role?.permissions || []).map((p) => p.code));
  memCache.set(roleId, set);
  memCacheAt = Date.now();
  return set;
}

export async function clearPermissionCache(roleId?: number): Promise<void> {
  if (isRedisReady()) {
    if (roleId) {
      await redis.del(`${PERM_PREFIX}${roleId}`);
    } else {
      // 清除所有权限缓存
      const keys = await redis.keys(`${PERM_PREFIX}*`);
      if (keys.length) await redis.del(...keys);
    }
  }
  memCache.clear();
  memCacheAt = 0;
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('未登录', 401, 401));
    if (!roles.includes(req.user.roleCode)) {
      return next(new AppError('无权限访问', 403, 403));
    }
    next();
  };
}

export function requirePermission(...codes: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError('未登录', 401, 401);
      if (req.user.roleCode === 'admin') return next();
      const set = await loadPermissions(req.user.roleId);
      const ok = codes.every((c) => set.has(c));
      if (!ok) throw new AppError('无权限访问', 403, 403);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function getRolePermissionCodes(roleId: number): Promise<string[]> {
  const set = await loadPermissions(roleId);
  return Array.from(set);
}
