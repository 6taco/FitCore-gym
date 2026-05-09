import { z } from 'zod';
import { Role, Permission, User } from '../models/index.js';
import { clearPermissionCache } from '../middleware/rbac.js';
import { success, AppError } from '../utils/response.js';

const saveSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(1).max(64),
  description: z.string().max(255).optional(),
  permissionIds: z.array(z.number().int().positive()).default([]),
});

export async function listRoles(_req, res, next) {
  try {
    const roles = await Role.findAll({
      include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code'] }],
      order: [['id', 'ASC']],
    });
    res.json(success(roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      permissionIds: r.permissions?.map((p) => p.id) ?? [],
      permissionCodes: r.permissions?.map((p) => p.code) ?? [],
      created_at: r.created_at,
    }))));
  } catch (err) { next(err); }
}

export async function createRole(req, res, next) {
  try {
    const data = saveSchema.parse(req.body);
    const exists = await Role.findOne({ where: { code: data.code } });
    if (exists) throw new AppError('角色编码已存在', 400);
    const role = await Role.create({
      code: data.code,
      name: data.name,
      description: data.description,
    });
    if (data.permissionIds.length) {
      await role.setPermissions(data.permissionIds);
    }
    clearPermissionCache();
    res.json(success({ id: role.id }, '创建成功'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function updateRole(req, res, next) {
  try {
    const data = saveSchema.partial().parse(req.body);
    const role = await Role.findByPk(req.params.id);
    if (!role) throw new AppError('角色不存在', 404);
    if (data.code && data.code !== role.code) {
      const dup = await Role.findOne({ where: { code: data.code } });
      if (dup) throw new AppError('角色编码已存在', 400);
    }
    await role.update({
      code: data.code ?? role.code,
      name: data.name ?? role.name,
      description: data.description ?? role.description,
    });
    if (Array.isArray(data.permissionIds)) {
      await role.setPermissions(data.permissionIds);
    }
    clearPermissionCache();
    res.json(success(null, '更新成功'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deleteRole(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) throw new AppError('角色不存在', 404);
    if (['admin', 'member'].includes(role.code)) {
      throw new AppError('内置角色不可删除', 400);
    }
    const count = await User.count({ where: { role_id: role.id } });
    if (count > 0) throw new AppError(`该角色下尚有 ${count} 个用户，请先迁移`, 400);
    await role.destroy();
    clearPermissionCache();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}

export async function listPermissions(_req, res, next) {
  try {
    const perms = await Permission.findAll({ order: [['module', 'ASC'], ['id', 'ASC']] });
    res.json(success(perms));
  } catch (err) { next(err); }
}
