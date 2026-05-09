import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, Role } from '../models/index.js';
import { signToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { getRolePermissionCodes } from '../middleware/rbac.js';
import { success, AppError } from '../utils/response.js';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export async function login(req, res, next) {
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
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function profile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, { include: [{ model: Role, as: 'role' }] });
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

export async function refreshTokenHandler(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('缺少 refreshToken', 400);
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.id, { include: [{ model: Role, as: 'role' }] });
    if (!user || user.status !== 1) throw new AppError('用户不存在或已停用', 401, 401);

    const token = signToken({
      id: user.id,
      username: user.username,
      roleId: user.role_id,
      roleCode: user.role?.code,
    });
    const newRefreshToken = signRefreshToken({ id: user.id });
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
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('refreshToken 无效或已过期', 401, 401));
    }
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = changePwdSchema.parse(req.body);
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user) throw new AppError('用户不存在', 404, 404);
    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) throw new AppError('原密码不正确', 400);
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json(success(null, '密码修改成功'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}
