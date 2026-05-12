import { Op } from 'sequelize';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import { sequelize, Member, MembershipPlan, Membership, Order, OrderItem, Payment } from '../models/index.js';
import { success, AppError } from '../utils/response.js';
import { genNo } from '../utils/idGen.js';

const issueSchema = z.object({
  member_id: z.number().int().positive(),
  plan_id: z.number().int().positive(),
  start_date: z.string().optional(),
});

function computeInitial(plan: any, startDate?: string) {
  const start = dayjs(startDate || undefined).format('YYYY-MM-DD');
  const out: any = { start_date: start, end_date: null, remaining_count: null, balance: null };
  if (plan.type === 'PERIOD') {
    out.end_date = dayjs(start).add(plan.duration_days, 'day').format('YYYY-MM-DD');
  } else if (plan.type === 'COUNT') {
    out.remaining_count = plan.total_count;
    out.end_date = dayjs(start).add(365, 'day').format('YYYY-MM-DD');
  } else if (plan.type === 'STORED') {
    out.balance = Number(plan.initial_balance || 0);
  }
  return out;
}

export async function issueMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const data = issueSchema.parse(req.body);
    const member = await Member.findByPk(data.member_id);
    if (!member) throw new AppError('会员不存在', 400);
    const plan = await MembershipPlan.findByPk(data.plan_id);
    if (!plan || plan.status !== 1) throw new AppError('卡种不可用', 400);
    const init = computeInitial(plan, data.start_date);
    let card_no: string | undefined;
    let unique = false;
    for (let i = 0; i < 10; i += 1) {
      card_no = genNo('C');
      const dup = await Membership.findOne({ where: { card_no } });
      if (!dup) { unique = true; break; }
    }
    if (!unique) throw new AppError('卡号生成失败，请重试', 500);
    const m = await Membership.create({
      member_id: member.id,
      plan_id: plan.id,
      card_no: card_no!,
      status: 'ACTIVE',
      ...init,
    });
    res.json(success({ id: m.id, card_no: m.card_no }, '办卡成功'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

const renewSchema = z.object({
  days: z.number().int().positive().optional(),
  count: z.number().int().positive().optional(),
  amount: z.number().positive().optional(),
});

export async function renewMembership(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { days, count, amount } = renewSchema.parse(req.body);
    const ms = await Membership.findByPk(req.params.id, {
      include: [{ model: MembershipPlan, as: 'plan' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ms) throw new AppError('会员卡不存在', 404);
    if (ms.status === 'CANCELLED') throw new AppError('该卡已作废，请办新卡', 400);

    const type = ms.plan?.type;
    if (type === 'PERIOD') {
      if (!days) throw new AppError('期限卡续费需填写续费天数', 400);
      const base = ms.end_date && dayjs(ms.end_date).isAfter(dayjs()) ? dayjs(ms.end_date) : dayjs();
      ms.end_date = base.add(days, 'day').format('YYYY-MM-DD');
    } else if (type === 'COUNT') {
      if (!count) throw new AppError('次卡续费需填写续费次数', 400);
      ms.remaining_count = (ms.remaining_count || 0) + count;
    } else if (type === 'STORED') {
      if (!amount) throw new AppError('储值卡续费需填写充值金额', 400);
      ms.balance = Number(ms.balance || 0) + Number(amount);
    }
    if (['EXPIRED', 'SUSPENDED'].includes(ms.status)) ms.status = 'ACTIVE';
    await ms.save({ transaction: t });
    await t.commit();
    res.json(success(null, '续费成功'));
  } catch (err: any) {
    await t.rollback();
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function suspendMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const ms = await Membership.findByPk(req.params.id);
    if (!ms) throw new AppError('会员卡不存在', 404);
    if (ms.status !== 'ACTIVE') throw new AppError('仅有效卡可挂起', 400);
    ms.status = 'SUSPENDED';
    ms.suspended_at = new Date();
    await ms.save();
    res.json(success(null, '已挂起'));
  } catch (err) { next(err); }
}

export async function resumeMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const ms = await Membership.findByPk(req.params.id);
    if (!ms) throw new AppError('会员卡不存在', 404);
    if (ms.status !== 'SUSPENDED') throw new AppError('仅挂起卡可恢复', 400);
    if (ms.end_date && ms.suspended_at) {
      const frozenDays = dayjs().diff(dayjs(ms.suspended_at), 'day');
      if (frozenDays > 0) {
        ms.end_date = dayjs(ms.end_date).add(frozenDays, 'day').format('YYYY-MM-DD');
      }
    }
    ms.status = 'ACTIVE';
    ms.suspended_at = null;
    await ms.save();
    res.json(success(null, '已恢复'));
  } catch (err) { next(err); }
}

const transferSchema = z.object({ target_member_id: z.number().int().positive() });

export async function transferMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const { target_member_id } = transferSchema.parse(req.body);
    const ms = await Membership.findByPk(req.params.id);
    if (!ms) throw new AppError('会员卡不存在', 404);
    if (ms.member_id === target_member_id) throw new AppError('目标会员与原会员相同', 400);
    if (!['ACTIVE', 'SUSPENDED'].includes(ms.status)) throw new AppError('仅有效/挂起卡可转让', 400);
    const target = await Member.findByPk(target_member_id);
    if (!target) throw new AppError('目标会员不存在', 400);
    ms.member_id = target_member_id;
    await ms.save();
    res.json(success(null, '转让成功'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function cancelMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const ms = await Membership.findByPk(req.params.id);
    if (!ms) throw new AppError('会员卡不存在', 404);
    if (ms.status === 'CANCELLED') throw new AppError('该卡已作废', 400);
    ms.status = 'CANCELLED';
    await ms.save();
    res.json(success(null, '已作废'));
  } catch (err) { next(err); }
}

export async function expiringMemberships(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Number(req.query.days || 7);
    const end = dayjs().add(days, 'day').endOf('day').toDate();
    const rows = await Membership.findAll({
      where: {
        status: 'ACTIVE',
        end_date: { [Op.ne]: null, [Op.lte]: end },
      },
      include: [
        { model: Member, as: 'member', attributes: ['id', 'name', 'member_no', 'phone'] },
        { model: MembershipPlan, as: 'plan' },
      ],
      order: [['end_date', 'ASC']],
      limit: 50,
    });
    res.json(success(rows));
  } catch (err) { next(err); }
}

export async function batchRenew(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { ids, days, count, amount } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('请选择要续费的会员卡', 400);
    if (ids.length > 100) throw new AppError('单次最多续费 100 张', 400);

    const results: { success: number; skipped: number; errors: string[] } = { success: 0, skipped: 0, errors: [] };
    for (const id of ids) {
      try {
        const ms = await Membership.findByPk(id, {
          include: [{ model: MembershipPlan, as: 'plan' }],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!ms) { results.errors.push(`卡 ${id} 不存在`); results.skipped++; continue; }
        if (ms.status === 'CANCELLED') { results.errors.push(`卡 ${ms.card_no} 已作废`); results.skipped++; continue; }

        const type = ms.plan?.type;
        if (type === 'PERIOD' && days) {
          const base = ms.end_date && dayjs(ms.end_date).isAfter(dayjs()) ? dayjs(ms.end_date) : dayjs();
          ms.end_date = base.add(days, 'day').format('YYYY-MM-DD');
        } else if (type === 'COUNT' && count) {
          ms.remaining_count = (ms.remaining_count || 0) + count;
        } else if (type === 'STORED' && amount) {
          ms.balance = Number(ms.balance || 0) + Number(amount);
        } else {
          results.errors.push(`卡 ${ms.card_no} 类型 ${type} 与提供参数不匹配`);
          results.skipped++;
          continue;
        }
        if (['EXPIRED', 'SUSPENDED'].includes(ms.status)) ms.status = 'ACTIVE';
        await ms.save({ transaction: t });
        results.success++;
      } catch (err: any) {
        results.errors.push(`卡 ${id}: ${err.message}`);
        results.skipped++;
      }
    }
    await t.commit();
    res.json(success(results, `批量续费完成：成功 ${results.success}，跳过 ${results.skipped}`));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

export async function storedCardHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const card = await Membership.findByPk(req.params.id, {
      include: [{ model: MembershipPlan, as: 'plan' }],
    });
    if (!card) throw new AppError('会员卡不存在', 404);
    if (card.plan?.type !== 'STORED') throw new AppError('该卡不是储值卡', 400);

    const { rows, count } = await Payment.findAndCountAll({
      where: { method: 'STORED', status: { [Op.in]: ['SUCCESS', 'REFUNDED'] } },
      include: [{
        model: Order,
        as: 'order',
        where: { member_id: card.member_id },
        include: [{ model: OrderItem, as: 'items' }],
        required: true,
      }],
      order: [['paid_at', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });

    res.json(success({
      card_no: card.card_no,
      balance: card.balance,
      list: rows.map((p: any) => ({
        id: p.id,
        order_no: p.order?.order_no,
        amount: p.amount,
        status: p.status,
        paid_at: p.paid_at,
        items: (p.order?.items || []).map((i: any) => ({ name: i.item_name, qty: i.quantity, subtotal: i.subtotal })),
      })),
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    }));
  } catch (err) { next(err); }
}
