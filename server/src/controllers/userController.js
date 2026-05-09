import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { z } from 'zod';
import { User, Role } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const createSchema = z.object({
  username: z.string().min(2, '用户名至少 2 位').max(32),
  password: z.string().min(6, '密码至少 6 位'),
  real_name: z.string().max(64).optional(),
  phone: z.string().max(20).optional(),
  role_id: z.number().int().positive(),
  status: z.number().int().min(0).max(1).optional(),
});

const updateSchema = z.object({
  real_name: z.string().max(64).optional(),
  phone: z.string().max(20).optional(),
  role_id: z.number().int().positive().optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export async function listUsers(req, res, next) {
  try {
    const { page = 1, pageSize = 10, keyword, role_id, status } = req.query;
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { real_name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (role_id) where.role_id = Number(role_id);
    if (status !== undefined && status !== '') where.status = Number(status);

    const { rows, count } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: 'role' }],
      order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });

    res.json(success({
      list: rows.map((u) => ({
        id: u.id,
        username: u.username,
        real_name: u.real_name,
        phone: u.phone,
        avatar: u.avatar,
        role_id: u.role_id,
        role_name: u.role?.name,
        role_code: u.role?.code,
        status: u.status,
        last_login_at: u.last_login_at,
        created_at: u.created_at,
      })),
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    }));
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const exists = await User.findOne({ where: { username: data.username } });
    if (exists) throw new AppError('用户名已存在', 400);
    const role = await Role.findByPk(data.role_id);
    if (!role) throw new AppError('角色不存在', 400);

    const user = await User.create({
      ...data,
      password_hash: await bcrypt.hash(data.password, 10),
      status: data.status ?? 1,
    });
    res.json(success({ id: user.id }, '创建成功'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('用户不存在', 404);
    if (data.role_id) {
      const role = await Role.findByPk(data.role_id);
      if (!role) throw new AppError('角色不存在', 400);
    }
    await user.update(data);
    res.json(success(null, '更新成功'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) throw new AppError('不能删除当前登录账号', 400);
    const user = await User.findByPk(id);
    if (!user) throw new AppError('用户不存在', 404);
    await user.destroy();
    res.json(success(null, '已删除'));
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const schema = z.object({ password: z.string().min(6, '密码至少 6 位') });
    const { password } = schema.parse(req.body);
    const user = await User.scope('withPassword').findByPk(req.params.id);
    if (!user) throw new AppError('用户不存在', 404);
    user.password_hash = await bcrypt.hash(password, 10);
    await user.save();
    res.json(success(null, '密码已重置'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}
