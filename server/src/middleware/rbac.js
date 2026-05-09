import { Role, Permission } from '../models/index.js';
import { AppError } from '../utils/response.js';

// 简单内存缓存：role_id -> Set<permission_code>
const cache = new Map();
let cacheAt = 0;
const CACHE_TTL = 60 * 1000;

async function loadPermissions(roleId) {
  if (cache.has(roleId) && Date.now() - cacheAt < CACHE_TTL) {
    return cache.get(roleId);
  }
  const role = await Role.findByPk(roleId, {
    include: [{ model: Permission, as: 'permissions', attributes: ['code'] }],
  });
  const set = new Set((role?.permissions || []).map((p) => p.code));
  cache.set(roleId, set);
  cacheAt = Date.now();
  return set;
}

export function clearPermissionCache() {
  cache.clear();
  cacheAt = 0;
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('未登录', 401, 401));
    if (!roles.includes(req.user.roleCode)) {
      return next(new AppError('无权限访问', 403, 403));
    }
    next();
  };
}

export function requirePermission(...codes) {
  return async (req, _res, next) => {
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

export async function getRolePermissionCodes(roleId) {
  const set = await loadPermissions(roleId);
  return Array.from(set);
}
