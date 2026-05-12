import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { User, Role } from '../models/index.js';
import { signToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { getRolePermissionCodes } from '../middleware/rbac.js';
import { success, AppError } from '../utils/response.js';
import redis, { isRedisReady } from '../utils/redis.js';

const RT_PREFIX = 'rt:';
const RT_TTL = 7 * 24 * 60 * 60; // 7 天

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = await User.scope('withPassword').findOne({
      where: { username },
      include: [{ model: Role, as: 'role' }],
    });
    if (!user || user.status !== 1) throw new AppError('账号不存在或已停用', 401, 401);
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new AppError('用户名或密码错误', 401, 401);

    user.last_login_at = new Date();
    await user.save();

    const tokenPayload = {
      id: user.id,
      username: user.username,
      roleId: user.role_id,
      roleCode: user.role?.code,
    };
    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user.id });

    // 将 refreshToken 存入 Redis，用于后续验证和主动失效
    if (isRedisReady()) {
      await redis.set(`${RT_PREFIX}${user.id}`, refreshToken, 'EX', RT_TTL);
    }

    const permissions = await getRolePermissionCodes(user.role_id);

    res.json(success({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        avatar: user.avatar,
        roleCode: user.role?.code,
        roleName: user.role?.name,
        permissions,
      },
    }, '登录成功'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function profile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findByPk(req.user!.id, { include: [{ model: Role, as: 'role' }] });
    if (!user) throw new AppError('用户不存在', 404, 404);
    const permissions = await getRolePermissionCodes(user.role_id);
    res.json(success({
      id: user.id,
      username: user.username,
      realName: user.real_name,
      avatar: user.avatar,
      roleCode: user.role?.code,
      roleName: user.role?.name,
      permissions,
    }));
  } catch (err) {
    next(err);
  }
}

const changePwdSchema = z.object({
  oldPassword: z.string().min(1, '请输入原密码'),
  newPassword: z.string().min(6, '新密码至少 6 位'),
});

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('缺少 refreshToken', 400);
    const decoded = verifyRefreshToken(refreshToken);

    // Redis 可用时校验 token 是否已被主动失效
    if (isRedisReady()) {
      const stored = await redis.get(`${RT_PREFIX}${decoded.id}`);
      if (stored && stored !== refreshToken) {
        throw new AppError('refreshToken 已失效（可能已在其他设备登录）', 401, 401);
      }
    }

    const user = await User.findByPk(decoded.id, { include: [{ model: Role, as: 'role' }] });
    if (!user || user.status !== 1) throw new AppError('用户不存在或已停用', 401, 401);

    const token = signToken({
      id: user.id,
      username: user.username,
      roleId: user.role_id,
      roleCode: user.role?.code,
    });
    const newRefreshToken = signRefreshToken({ id: user.id });

    // 更新 Redis 中的 refreshToken
    if (isRedisReady()) {
      await redis.set(`${RT_PREFIX}${user.id}`, newRefreshToken, 'EX', RT_TTL);
    }

    const permissions = await getRolePermissionCodes(user.role_id);

    res.json(success({
      token,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        avatar: user.avatar,
        roleCode: user.role?.code,
        roleName: user.role?.name,
        permissions,
      },
    }));
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('refreshToken 无效或已过期', 401, 401));
    }
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { oldPassword, newPassword } = changePwdSchema.parse(req.body);
    const user = await User.scope('withPassword').findByPk(req.user!.id);
    if (!user) throw new AppError('用户不存在', 404, 404);
    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) throw new AppError('原密码不正确', 400);
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // 修改密码后主动让旧 refreshToken 失效
    if (isRedisReady()) {
      await redis.del(`${RT_PREFIX}${user.id}`);
    }

    res.json(success(null, '密码修改成功'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}
