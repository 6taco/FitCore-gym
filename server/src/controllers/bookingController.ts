import { Op } from 'sequelize';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import {
  sequelize, CourseSchedule, Booking, Member, Membership, MembershipPlan, Course, Coach,
} from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const bookSchema = z.object({
  schedule_id: z.number().int().positive(),
  member_id: z.number().int().positive(),
  remark: z.string().max(255).optional().nullable(),
});

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const data = bookSchema.parse(req.body);
    const schedule = await CourseSchedule.findByPk(data.schedule_id, {
      transaction: t, lock: t.LOCK.UPDATE,
    });
    if (!schedule) throw new AppError('排期不存在', 404);
    if (schedule.status !== 'OPEN') throw new AppError('该排期已关闭或取消', 400);
    if (dayjs(schedule.start_time).isBefore(dayjs())) throw new AppError('课程已开始，无法预约', 400);
    if (schedule.capacity && schedule.booked_count >= schedule.capacity) {
      throw new AppError('该排期已约满', 400);
    }
    const member = await Member.findByPk(data.member_id, { transaction: t });
    if (!member) throw new AppError('会员不存在', 400);

    const existing = await Booking.findOne({
      where: { schedule_id: schedule.id, member_id: member.id },
      transaction: t,
    });
    if (existing && ['BOOKED', 'CHECKED_IN'].includes(existing.status)) {
      throw new AppError('该会员已预约此排期', 400);
    }

    let b;
    if (existing) {
      existing.status = 'BOOKED';
      existing.remark = data.remark || null;
      await existing.save({ transaction: t });
      b = existing;
    } else {
      b = await Booking.create({
        schedule_id: schedule.id,
        member_id: member.id,
        status: 'BOOKED',
        remark: data.remark || null,
      }, { transaction: t });
    }

    schedule.booked_count += 1;
    await schedule.save({ transaction: t });

    await t.commit();
    res.json(success({ id: b.id }, '预约成功'));
  } catch (err: any) {
    await t.rollback();
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const b = await Booking.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!b) throw new AppError('预约不存在', 404);
    if (b.status !== 'BOOKED') throw new AppError('当前状态不可取消', 400);

    const schedule = await CourseSchedule.findByPk(b.schedule_id, {
      transaction: t, lock: t.LOCK.UPDATE,
    });
    if (schedule && dayjs(schedule.start_time).isBefore(dayjs())) {
      throw new AppError('课程已开始，无法取消', 400);
    }

    b.status = 'CANCELLED';
    await b.save({ transaction: t });
    if (schedule) {
      schedule.booked_count = Math.max(0, schedule.booked_count - 1);
      await schedule.save({ transaction: t });
    }
    await t.commit();
    res.json(success(null, '已取消预约'));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

export async function checkInBooking(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const b = await Booking.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!b) throw new AppError('预约不存在', 404);
    if (b.status !== 'BOOKED') throw new AppError('当前状态不可签到', 400);

    const card = await Membership.findOne({
      where: {
        member_id: b.member_id,
        status: 'ACTIVE',
        remaining_count: { [Op.gt]: 0 },
      },
      include: [{ model: MembershipPlan, as: 'plan', where: { type: 'COUNT' }, required: true }],
      order: [['end_date', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    let deducted: { card_no: string; remaining: number } | null = null;
    if (card) {
      card.remaining_count! -= 1;
      await card.save({ transaction: t });
      deducted = { card_no: card.card_no, remaining: card.remaining_count! };
    }

    b.status = 'CHECKED_IN';
    b.checked_in_at = new Date();
    await b.save({ transaction: t });
    await t.commit();
    res.json(success({ deducted }, card ? `已签到并扣次卡 ${deducted!.card_no} 1 次` : '已签到'));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

export async function noShowBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const b = await Booking.findByPk(req.params.id);
    if (!b) throw new AppError('预约不存在', 404);
    if (b.status !== 'BOOKED') throw new AppError('当前状态不可标记未到', 400);
    b.status = 'NO_SHOW';
    await b.save();
    res.json(success(null, '已标记未到'));
  } catch (err) { next(err); }
}

export async function selfBook(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { schedule_id } = req.body;
    if (!schedule_id) throw new AppError('缺少 schedule_id', 400);

    const member = await Member.findOne({ where: { user_id: req.user!.id }, transaction: t });
    if (!member) throw new AppError('当前账号未关联会员档案，请联系前台', 400);

    const schedule = await CourseSchedule.findByPk(schedule_id, {
      transaction: t, lock: t.LOCK.UPDATE,
    });
    if (!schedule) throw new AppError('排期不存在', 404);
    if (schedule.status !== 'OPEN') throw new AppError('该排期已关闭或取消', 400);
    if (dayjs(schedule.start_time).isBefore(dayjs())) throw new AppError('课程已开始，无法预约', 400);
    if (schedule.capacity && schedule.booked_count >= schedule.capacity) {
      throw new AppError('该排期已约满', 400);
    }

    const existing = await Booking.findOne({
      where: { schedule_id: schedule.id, member_id: member.id },
      transaction: t,
    });
    if (existing && ['BOOKED', 'CHECKED_IN'].includes(existing.status)) {
      throw new AppError('您已预约此课程', 400);
    }

    let b;
    if (existing) {
      existing.status = 'BOOKED';
      existing.remark = null;
      await existing.save({ transaction: t });
      b = existing;
    } else {
      b = await Booking.create({
        schedule_id: schedule.id,
        member_id: member.id,
        status: 'BOOKED',
      }, { transaction: t });
    }

    schedule.booked_count += 1;
    await schedule.save({ transaction: t });

    await t.commit();
    res.json(success({ id: b.id }, '预约成功'));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

export async function selfCancelBooking(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const member = await Member.findOne({ where: { user_id: req.user!.id }, transaction: t });
    if (!member) throw new AppError('当前账号未关联会员档案', 400);

    const b = await Booking.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!b) throw new AppError('预约不存在', 404);
    if (b.member_id !== member.id) throw new AppError('只能取消自己的预约', 403);
    if (b.status !== 'BOOKED') throw new AppError('当前状态不可取消', 400);

    const schedule = await CourseSchedule.findByPk(b.schedule_id, {
      transaction: t, lock: t.LOCK.UPDATE,
    });
    if (schedule && dayjs(schedule.start_time).isBefore(dayjs())) {
      throw new AppError('课程已开始，无法取消', 400);
    }

    b.status = 'CANCELLED';
    await b.save({ transaction: t });
    if (schedule) {
      schedule.booked_count = Math.max(0, schedule.booked_count - 1);
      await schedule.save({ transaction: t });
    }
    await t.commit();
    res.json(success(null, '已取消预约'));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

export async function myBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const { member_id, status, upcoming } = req.query;
    if (!member_id) throw new AppError('缺少 member_id', 400);
    const where: any = { member_id: Number(member_id) };
    if (status) where.status = status;
    const include: any[] = [
      {
        model: CourseSchedule, as: 'schedule',
        include: [
          { model: Course, as: 'course' },
          { model: Coach, as: 'coach', attributes: ['id', 'name', 'avatar'] },
        ],
        ...(upcoming === '1'
          ? { where: { start_time: { [Op.gte]: new Date() } }, required: true }
          : {}),
      },
    ];
    const rows = await Booking.findAll({
      where, include,
      order: [[{ model: CourseSchedule, as: 'schedule' }, 'start_time', 'DESC']],
      limit: 100,
    });
    res.json(success(rows));
  } catch (err) { next(err); }
}
