import { Op } from 'sequelize';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Member, Membership, MembershipPlan, BodyMeasurement, User, Role } from '../models/index.js';
import { success, AppError } from '../utils/response.js';
import { genNo } from '../utils/idGen.js';

const coerceNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

const saveSchema = z.object({
  name: z.string().min(1).max(64),
  gender: z.preprocess(coerceNum, z.number().int().min(0).max(2).nullable()).optional(),
  birthday: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  id_card: z.string().max(32).optional().nullable(),
  avatar: z.string().max(255).optional().nullable(),
  height_cm: z.preprocess(coerceNum, z.number().nullable()).optional(),
  weight_kg: z.preprocess(coerceNum, z.number().nullable()).optional(),
  tags: z.string().max(255).optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
  status: z.preprocess(coerceNum, z.number().int().min(0).max(1).nullable()).optional(),
  user_id: z.preprocess(coerceNum, z.number().int().positive().nullable()).optional(),
});

export async function listMembers(req, res, next) {
  try {
    const { page = 1, pageSize = 10, keyword, status, tag } = req.query;
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { member_no: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined && status !== '') where.status = Number(status);
    if (tag) where.tags = { [Op.like]: `%${tag}%` };

    const { rows, count } = await Member.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });

    // 附带活跃会籍数
    const memberIds = rows.map((m) => m.id);
    const activeCounts = memberIds.length ? await Membership.findAll({
      where: { member_id: memberIds, status: 'ACTIVE' },
      attributes: ['member_id'],
    }) : [];
    const cntMap = activeCounts.reduce((acc, m) => {
      acc[m.member_id] = (acc[m.member_id] || 0) + 1;
      return acc;
    }, {});

    res.json(success({
      list: rows.map((m) => ({ ...m.toJSON(), active_memberships: cntMap[m.id] || 0 })),
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    }));
  } catch (err) { next(err); }
}

export async function getMember(req, res, next) {
  try {
    const m = await Member.findByPk(req.params.id);
    if (!m) throw new AppError('会员不存在', 404);
    res.json(success(m));
  } catch (err) { next(err); }
}

export async function createMember(req, res, next) {
  try {
    const data = saveSchema.parse(req.body);
    let member_no;
    let unique = false;
    for (let i = 0; i < 10; i += 1) {
      member_no = genNo('M');
      const exists = await Member.findOne({ where: { member_no } });
      if (!exists) { unique = true; break; }
    }
    if (!unique) throw new AppError('会员编号生成失败，请重试', 500);
    if (data.user_id) {
      const linked = await Member.findOne({ where: { user_id: data.user_id } });
      if (linked) throw new AppError('该账号已关联其他会员', 400);
    }
    const m = await Member.create({
      ...data,
      member_no,
      status: data.status ?? 1,
    });
    res.json(success({ id: m.id, member_no: m.member_no }, '已创建'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function updateMember(req, res, next) {
  try {
    const data = saveSchema.partial().parse(req.body);
    const m = await Member.findByPk(req.params.id);
    if (!m) throw new AppError('会员不存在', 404);
    if (data.user_id && data.user_id !== m.user_id) {
      const linked = await Member.findOne({ where: { user_id: data.user_id } });
      if (linked && linked.id !== m.id) throw new AppError('该账号已关联其他会员', 400);
    }
    await m.update(data);
    res.json(success(null, '已更新'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deleteMember(req, res, next) {
  try {
    const m = await Member.findByPk(req.params.id);
    if (!m) throw new AppError('会员不存在', 404);
    const cnt = await Membership.count({ where: { member_id: m.id, status: 'ACTIVE' } });
    if (cnt > 0) throw new AppError(`该会员仍有 ${cnt} 张有效卡，请先处理`, 400);
    await m.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}

// ============ 可关联账号列表 ============
export async function linkableUsers(req, res, next) {
  try {
    const memberRole = await Role.findOne({ where: { code: 'member' } });
    if (!memberRole) return res.json(success([]));
    const linkedIds = (await Member.findAll({
      where: { user_id: { [Op.ne]: null } },
      attributes: ['user_id'],
      raw: true,
    })).map((m) => m.user_id);
    const where = { role_id: memberRole.id, status: 1 };
    if (linkedIds.length) where.id = { [Op.notIn]: linkedIds };
    // 如果是编辑，把当前会员已关联的 user 也加进来
    const { current_user_id } = req.query;
    let extra = [];
    if (current_user_id) {
      const u = await User.findByPk(Number(current_user_id));
      if (u) extra = [{ id: u.id, username: u.username, real_name: u.real_name }];
    }
    const users = await User.findAll({ where, attributes: ['id', 'username', 'real_name'], order: [['id', 'ASC']] });
    const list = [...extra, ...users.filter((u) => !extra.some((e) => e.id === u.id))];
    res.json(success(list));
  } catch (err) { next(err); }
}

// ============ 会员卡 ============
export async function memberMemberships(req, res, next) {
  try {
    const rows = await Membership.findAll({
      where: { member_id: req.params.id },
      include: [{ model: MembershipPlan, as: 'plan' }],
      order: [['id', 'DESC']],
    });
    res.json(success(rows));
  } catch (err) { next(err); }
}

// ============ 体测 ============
const bmSchema = z.object({
  measured_at: z.string(),
  height_cm: z.number().optional().nullable(),
  weight_kg: z.number().optional().nullable(),
  body_fat: z.number().optional().nullable(),
  muscle_kg: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
});

export async function listMeasurements(req, res, next) {
  try {
    const rows = await BodyMeasurement.findAll({
      where: { member_id: req.params.id },
      order: [['measured_at', 'DESC']],
    });
    res.json(success(rows));
  } catch (err) { next(err); }
}

export async function createMeasurement(req, res, next) {
  try {
    const data = bmSchema.parse(req.body);
    const m = await Member.findByPk(req.params.id);
    if (!m) throw new AppError('会员不存在', 404);
    // 自动算 BMI
    if (!data.bmi && data.height_cm && data.weight_kg) {
      const h = Number(data.height_cm) / 100;
      data.bmi = Number((Number(data.weight_kg) / (h * h)).toFixed(2));
    }
    const r = await BodyMeasurement.create({
      ...data,
      member_id: m.id,
      measured_at: dayjs(data.measured_at).toDate(),
    });
    // 同步会员档案身高体重（最新一条）
    await m.update({
      height_cm: data.height_cm ?? m.height_cm,
      weight_kg: data.weight_kg ?? m.weight_kg,
    });
    res.json(success({ id: r.id }, '已记录'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deleteMeasurement(req, res, next) {
  try {
    const r = await BodyMeasurement.findByPk(req.params.bmId);
    if (!r) throw new AppError('体测记录不存在', 404);
    if (String(r.member_id) !== String(req.params.id)) throw new AppError('数据不匹配', 400);
    await r.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}

// ============ 概要统计（Dashboard） ============
export async function memberStats(_req, res, next) {
  try {
    const total = await Member.count();
    const active = await Membership.count({ where: { status: 'ACTIVE' } });
    const startOfMonth = dayjs().startOf('month').toDate();
    const newThisMonth = await Member.count({
      where: { created_at: { [Op.gte]: startOfMonth } },
    });
    res.json(success({ total, active_memberships: active, new_this_month: newThisMonth }));
  } catch (err) { next(err); }
}
