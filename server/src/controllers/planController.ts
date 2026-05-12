import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { MembershipPlan, Membership } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const schema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(1).max(64),
  type: z.enum(['PERIOD', 'COUNT', 'STORED']),
  price: z.number().nonnegative(),
  duration_days: z.number().int().positive().optional().nullable(),
  total_count: z.number().int().positive().optional().nullable(),
  initial_balance: z.number().nonnegative().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  status: z.number().int().min(0).max(1).optional(),
});

function validateByType(data: any) {
  if (data.type === 'PERIOD' && !data.duration_days) throw new AppError('期限卡需填写有效期天数', 400);
  if (data.type === 'COUNT' && !data.total_count) throw new AppError('次卡需填写总次数', 400);
  if (data.type === 'STORED' && !(data.initial_balance >= 0)) throw new AppError('储值卡需填写初始金额', 400);
}

export async function listPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status !== undefined && status !== '') where.status = Number(status);
    const rows = await MembershipPlan.findAll({ where, order: [['id', 'DESC']] });
    res.json(success(rows));
  } catch (err) { next(err); }
}

export async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const data = schema.parse(req.body);
    validateByType(data);
    const exists = await MembershipPlan.findOne({ where: { code: data.code } });
    if (exists) throw new AppError('卡种编码已存在', 400);
    const p = await MembershipPlan.create({ ...data, status: data.status ?? 1 } as any);
    res.json(success({ id: p.id }, '已创建'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const data = schema.partial().parse(req.body);
    const p = await MembershipPlan.findByPk(req.params.id);
    if (!p) throw new AppError('卡种不存在', 404);
    if (data.code && data.code !== p.code) {
      const dup = await MembershipPlan.findOne({ where: { code: data.code } });
      if (dup) throw new AppError('卡种编码已存在', 400);
    }
    const merged = { ...p.toJSON(), ...data };
    if (data.type) validateByType(merged);
    await p.update(data);
    res.json(success(null, '已更新'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deletePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await MembershipPlan.findByPk(req.params.id);
    if (!p) throw new AppError('卡种不存在', 404);
    const used = await Membership.count({ where: { plan_id: p.id } });
    if (used > 0) throw new AppError(`该卡种已被 ${used} 张会员卡引用，请改为停用`, 400);
    await p.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}
