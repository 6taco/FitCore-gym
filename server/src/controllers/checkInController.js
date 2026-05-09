import { Op } from 'sequelize';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { z } from 'zod';
import { CheckIn, Member, User, Membership } from '../models/index.js';
import { success, AppError } from '../utils/response.js';
import { exchangeCodeForOpenId } from './wechatController.js';

const QR_TOKEN_TTL_MS = 5 * 60 * 1000;
const BIND_TOKEN_TTL_MS = 5 * 60 * 1000;

// token -> { createdAt, status, memberName, checkInAt, errorMessage }
const qrTokenCache = new Map();
// bindToken -> { token, openid, createdAt }
const bindTokenCache = new Map();

const createSchema = z.object({
  member_id: z.number().int().positive(),
  method: z.enum(['MANUAL', 'CARD', 'QR']).optional(),
  remark: z.string().max(255).optional().nullable(),
});

const wechatScanSchema = z.object({
  code: z.string().min(1, '缺少微信授权 code'),
});

const bindWechatSchema = z.object({
  bind_token: z.string().min(1, '缺少绑定 token'),
  member_no: z.string().min(1, '请输入会员编号').max(32),
  phone: z.string().min(1, '请输入手机号').max(20),
});

function cleanupCaches() {
  const now = Date.now();

  for (const [token, session] of qrTokenCache) {
    if (now - session.createdAt > QR_TOKEN_TTL_MS * 2) {
      qrTokenCache.delete(token);
      continue;
    }
    if (now - session.createdAt > QR_TOKEN_TTL_MS && session.status === 'PENDING') {
      session.status = 'EXPIRED';
      session.errorMessage = '签到码已过期，请刷新后重试';
    }
  }

  for (const [bindToken, bind] of bindTokenCache) {
    if (now - bind.createdAt > BIND_TOKEN_TTL_MS) bindTokenCache.delete(bindToken);
  }
}

function formatQrSessionStatus(session) {
  return {
    status: session.status,
    member_name: session.memberName || undefined,
    check_in_at: session.checkInAt || undefined,
    message: session.errorMessage || undefined,
  };
}

function getQrSessionOrThrow(token) {
  cleanupCaches();
  if (!token) throw new AppError('缺少签到 token', 400);

  const session = qrTokenCache.get(token);
  if (!session) throw new AppError('签到码已失效，请刷新后重试', 400);

  if (session.status === 'EXPIRED') throw new AppError('签到码已过期，请刷新后重试', 400);
  if (session.status === 'SUCCESS') throw new AppError('该签到码已使用，请刷新后重试', 400);
  if (session.status === 'FAILED') throw new AppError(session.errorMessage || '签到失败，请刷新后重试', 400);

  return session;
}

function markQrSessionSuccess(session, memberName, checkInAt = new Date()) {
  session.status = 'SUCCESS';
  session.memberName = memberName;
  session.checkInAt = dayjs(checkInAt).toISOString();
  session.errorMessage = null;
}

function markQrSessionFailed(session, message) {
  session.status = 'FAILED';
  session.errorMessage = message || '签到失败';
}

async function ensureMemberCanCheckIn(member, duplicateMsg) {
  if (!member) throw new AppError('会员不存在', 404);
  if (member.status !== 1) throw new AppError('该会员已停用', 400);

  const activeCard = await Membership.findOne({
    where: { member_id: member.id, status: 'ACTIVE' },
  });
  if (!activeCard) throw new AppError('该会员无有效会员卡，无法入场', 400);

  const todayStart = dayjs().startOf('day').toDate();
  const todayEnd = dayjs().endOf('day').toDate();
  const exists = await CheckIn.findOne({
    where: { member_id: member.id, check_in_at: { [Op.between]: [todayStart, todayEnd] } },
  });
  if (exists) throw new AppError(duplicateMsg, 400);
}

async function createCheckInRecord(member, method, remark, operatorId) {
  return CheckIn.create({
    member_id: member.id,
    method,
    operator_id: operatorId,
    remark,
    check_in_at: new Date(),
  });
}

export async function checkIn(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const member = await Member.findByPk(data.member_id);

    await ensureMemberCanCheckIn(member, '该会员今日已签到');
    const record = await createCheckInRecord(member, data.method || 'MANUAL', data.remark || null, req.user?.id || null);

    res.json(success({ id: record.id, member_name: member.name }, '签到成功'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function listCheckIns(req, res, next) {
  try {
    const { page = 1, pageSize = 20, member_id, start, end } = req.query;
    const where = {};
    if (member_id) where.member_id = Number(member_id);
    if (start || end) {
      where.check_in_at = {};
      if (start) where.check_in_at[Op.gte] = dayjs(start).startOf('day').toDate();
      if (end) where.check_in_at[Op.lte] = dayjs(end).endOf('day').toDate();
    }

    const { rows, count } = await CheckIn.findAndCountAll({
      where,
      include: [
        { model: Member, as: 'member', attributes: ['id', 'name', 'member_no', 'phone'] },
        { model: User, as: 'operator', attributes: ['id', 'username', 'real_name'] },
      ],
      order: [['check_in_at', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });

    res.json(success({ list: rows, total: count, page: Number(page), pageSize: Number(pageSize) }));
  } catch (err) { next(err); }
}

export async function todayStats(req, res, next) {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const count = await CheckIn.count({
      where: { check_in_at: { [Op.between]: [todayStart, todayEnd] } },
    });
    res.json(success({ today: count }));
  } catch (err) { next(err); }
}

export async function generateQrToken(req, res, next) {
  try {
    cleanupCaches();
    const token = crypto.randomUUID();
    qrTokenCache.set(token, {
      createdAt: Date.now(),
      status: 'PENDING',
      memberName: null,
      checkInAt: null,
      errorMessage: null,
    });
    res.json(success({ token, expires_in: 300 }));
  } catch (err) { next(err); }
}

export async function getQrCheckInStatus(req, res, next) {
  try {
    const { token } = req.params;
    if (!token) throw new AppError('缺少签到 token', 400);

    cleanupCaches();
    const session = qrTokenCache.get(token);
    if (!session) {
      return res.json(success({ status: 'EXPIRED', message: '签到码已失效，请刷新后重试' }));
    }

    res.json(success(formatQrSessionStatus(session)));
  } catch (err) { next(err); }
}

// 兼容：系统账号登录后扫码签到
export async function qrCheckIn(req, res, next) {
  let session;
  try {
    const { token } = req.params;
    session = getQrSessionOrThrow(token);

    if (!req.user?.id) throw new AppError('未登录', 401);
    const member = await Member.findOne({ where: { user_id: req.user.id } });
    if (!member) throw new AppError('当前账号未关联会员档案，请联系前台', 400);

    await ensureMemberCanCheckIn(member, '您今日已签到，无需重复签到');
    const record = await createCheckInRecord(member, 'QR', '扫码自助签到', null);

    markQrSessionSuccess(session, member.name, record.check_in_at);
    res.json(success({ id: record.id, member_name: member.name }, '签到成功，欢迎入场！'));
  } catch (err) {
    if (session && session.status === 'PENDING' && err instanceof AppError) {
      if (['该会员已停用', '该会员无有效会员卡，无法入场', '您今日已签到，无需重复签到'].includes(err.message)) {
        markQrSessionFailed(session, err.message);
      }
    }
    next(err);
  }
}

// 微信扫码签到（公众号 OAuth）
export async function qrCheckInByWechat(req, res, next) {
  let session;
  try {
    const { token } = req.params;
    const body = wechatScanSchema.parse(req.body);

    session = getQrSessionOrThrow(token);

    const { openid } = await exchangeCodeForOpenId(body.code);
    const member = await Member.scope('withWechat').findOne({ where: { wechat_openid: openid } });

    if (!member) {
      const bindToken = crypto.randomUUID();
      bindTokenCache.set(bindToken, {
        token,
        openid,
        createdAt: Date.now(),
      });
      return res.json(success({ status: 'BIND_REQUIRED', bind_token: bindToken }, '请先绑定会员信息'));
    }

    await ensureMemberCanCheckIn(member, '您今日已签到，无需重复签到');
    const record = await createCheckInRecord(member, 'QR', '微信扫码签到', null);

    markQrSessionSuccess(session, member.name, record.check_in_at);

    res.json(success({
      status: 'SUCCESS',
      id: record.id,
      member_name: member.name,
      check_in_at: dayjs(record.check_in_at).toISOString(),
    }, '签到成功，欢迎入场！'));
  } catch (err) {
    if (err?.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    if (session && session.status === 'PENDING' && err instanceof AppError) {
      if (['该会员已停用', '该会员无有效会员卡，无法入场', '您今日已签到，无需重复签到'].includes(err.message)) {
        markQrSessionFailed(session, err.message);
      }
    }
    next(err);
  }
}

export async function bindWechatAndCheckIn(req, res, next) {
  let session;
  try {
    const data = bindWechatSchema.parse(req.body);
    cleanupCaches();

    const bind = bindTokenCache.get(data.bind_token);
    if (!bind) throw new AppError('绑定已失效，请重新扫码', 400);

    session = getQrSessionOrThrow(bind.token);

    const member = await Member.scope('withWechat').findOne({
      where: { member_no: data.member_no.trim(), phone: data.phone.trim() },
    });
    if (!member) throw new AppError('会员编号或手机号不匹配', 400);
    if (member.status !== 1) throw new AppError('该会员已停用', 400);

    const occupied = await Member.findOne({ where: { wechat_openid: bind.openid } });
    if (occupied && occupied.id !== member.id) throw new AppError('该微信已绑定其他会员，请联系前台', 400);
    if (member.wechat_openid && member.wechat_openid !== bind.openid) {
      throw new AppError('该会员已绑定其他微信，请联系前台处理', 400);
    }

    if (member.wechat_openid !== bind.openid || !member.wechat_bound_at) {
      await member.update({
        wechat_openid: bind.openid,
        wechat_bound_at: new Date(),
      });
    }

    await ensureMemberCanCheckIn(member, '您今日已签到，无需重复签到');
    const record = await createCheckInRecord(member, 'QR', '微信扫码签到', null);

    bindTokenCache.delete(data.bind_token);
    markQrSessionSuccess(session, member.name, record.check_in_at);

    res.json(success({
      status: 'SUCCESS',
      id: record.id,
      member_name: member.name,
      check_in_at: dayjs(record.check_in_at).toISOString(),
    }, '绑定并签到成功，欢迎入场！'));
  } catch (err) {
    if (err?.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    if (session && session.status === 'PENDING' && err instanceof AppError) {
      if (['该会员已停用', '该会员无有效会员卡，无法入场', '您今日已签到，无需重复签到', '该微信已绑定其他会员，请联系前台', '该会员已绑定其他微信，请联系前台处理'].includes(err.message)) {
        markQrSessionFailed(session, err.message);
      }
    }
    next(err);
  }
}
