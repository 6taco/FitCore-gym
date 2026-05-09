import { Op } from 'sequelize';
import { z } from 'zod';
import dayjs from 'dayjs';
import {
  sequelize, Course, CourseSchedule, Coach, Booking, Member, Notification,
} from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const saveSchema = z.object({
  course_id: z.number().int().positive(),
  coach_id: z.number().int().positive(),
  start_time: z.string(),
  location: z.string().max(64).optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
});

export async function listSchedules(req, res, next) {
  try {
    const { start, end, coach_id, course_id, status } = req.query;
    const where = {};
    if (start || end) {
      where.start_time = {};
      if (start) where.start_time[Op.gte] = dayjs(start).toDate();
      if (end) where.start_time[Op.lte] = dayjs(end).toDate();
    }
    if (coach_id) where.coach_id = Number(coach_id);
    if (course_id) where.course_id = Number(course_id);
    if (status) where.status = status;

    const rows = await CourseSchedule.findAll({
      where,
      include: [
        { model: Course, as: 'course' },
        { model: Coach, as: 'coach', attributes: ['id', 'name', 'avatar'] },
      ],
      order: [['start_time', 'ASC']],
    });
    res.json(success(rows));
  } catch (err) { next(err); }
}

export async function getSchedule(req, res, next) {
  try {
    const s = await CourseSchedule.findByPk(req.params.id, {
      include: [
        { model: Course, as: 'course' },
        { model: Coach, as: 'coach' },
        {
          model: Booking, as: 'bookings',
          include: [{ model: Member, as: 'member', attributes: ['id', 'name', 'phone', 'member_no', 'avatar'] }],
        },
      ],
    });
    if (!s) throw new AppError('排期不存在', 404);
    res.json(success(s));
  } catch (err) { next(err); }
}

export async function createSchedule(req, res, next) {
  try {
    const data = saveSchema.parse(req.body);
    const course = await Course.findByPk(data.course_id);
    if (!course || course.status !== 1) throw new AppError('课程不可用', 400);
    const coach = await Coach.findByPk(data.coach_id);
    if (!coach || coach.status !== 1) throw new AppError('教练不可用', 400);

    const start = dayjs(data.start_time);
    const end = start.add(course.duration_min, 'minute');
    const cap = data.capacity || (course.type === 'PERSONAL' ? 1 : course.capacity);

    // 教练时段冲突检查
    const conflict = await CourseSchedule.findOne({
      where: {
        coach_id: coach.id,
        status: { [Op.ne]: 'CANCELLED' },
        [Op.and]: [
          { start_time: { [Op.lt]: end.toDate() } },
          { end_time: { [Op.gt]: start.toDate() } },
        ],
      },
    });
    if (conflict) throw new AppError('该教练此时段已有排期', 400);

    const s = await CourseSchedule.create({
      course_id: course.id,
      coach_id: coach.id,
      start_time: start.toDate(),
      end_time: end.toDate(),
      location: data.location || null,
      capacity: cap,
      booked_count: 0,
      status: 'OPEN',
    });
    res.json(success({ id: s.id }, '已排课'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

const updateSchema = z.object({
  coach_id: z.number().int().positive().optional(),
  start_time: z.string().optional(),
  location: z.string().max(64).optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
});

export async function updateSchedule(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const s = await CourseSchedule.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course' }],
    });
    if (!s) throw new AppError('排期不存在', 404);
    if (s.status !== 'OPEN') throw new AppError('仅 OPEN 状态排期可编辑', 400);
    if (dayjs(s.start_time).isBefore(dayjs())) throw new AppError('已开始的排期不可编辑', 400);

    const coachId = data.coach_id || s.coach_id;
    if (data.coach_id) {
      const coach = await Coach.findByPk(data.coach_id);
      if (!coach || coach.status !== 1) throw new AppError('教练不可用', 400);
    }

    let startTime = s.start_time;
    let endTime = s.end_time;
    if (data.start_time) {
      const start = dayjs(data.start_time);
      startTime = start.toDate();
      endTime = start.add(s.course.duration_min, 'minute').toDate();
    }

    // 教练时段冲突检查（排除自身）
    const conflict = await CourseSchedule.findOne({
      where: {
        id: { [Op.ne]: s.id },
        coach_id: coachId,
        status: { [Op.ne]: 'CANCELLED' },
        [Op.and]: [
          { start_time: { [Op.lt]: endTime } },
          { end_time: { [Op.gt]: startTime } },
        ],
      },
    });
    if (conflict) throw new AppError('该教练此时段已有排期', 400);

    if (data.capacity && s.booked_count > data.capacity) {
      throw new AppError(`已有 ${s.booked_count} 人预约，容量不能低于此数`, 400);
    }

    await s.update({
      coach_id: coachId,
      start_time: startTime,
      end_time: endTime,
      location: data.location !== undefined ? data.location : s.location,
      capacity: data.capacity || s.capacity,
    });
    res.json(success(null, '排期已更新'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function cancelSchedule(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const s = await CourseSchedule.findByPk(req.params.id, {
      transaction: t, lock: t.LOCK.UPDATE,
      include: [{ model: Course, as: 'course' }],
    });
    if (!s) throw new AppError('排期不存在', 404);
    if (s.status === 'CANCELLED') throw new AppError('该排期已取消', 400);

    // 查出所有受影响的预约会员（有关联 user_id 的才能收通知）
    const bookedList = await Booking.findAll({
      where: { schedule_id: s.id, status: 'BOOKED' },
      include: [{ model: Member, as: 'member', attributes: ['id', 'name', 'user_id'] }],
      transaction: t,
    });

    s.status = 'CANCELLED';
    await s.save({ transaction: t });

    // 同步取消所有未签到的预约
    await Booking.update(
      { status: 'CANCELLED', remark: '排期取消' },
      { where: { schedule_id: s.id, status: 'BOOKED' }, transaction: t },
    );

    // 给受影响的会员发送通知
    const courseName = s.course?.name || '未知课程';
    const startStr = dayjs(s.start_time).format('MM-DD HH:mm');
    const notifications = bookedList
      .filter((b) => b.member?.user_id)
      .map((b) => ({
        user_id: b.member.user_id,
        type: 'SCHEDULE',
        title: '排期取消通知',
        content: `您预约的课程「${courseName}」(${startStr}) 已被取消，预约自动作废，如有疑问请联系前台。`,
        is_read: 0,
      }));
    if (notifications.length) {
      await Notification.bulkCreate(notifications, { transaction: t });
    }

    await t.commit();
    res.json(success(null, `排期已取消，已通知 ${notifications.length} 位会员`));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

export async function deleteSchedule(req, res, next) {
  try {
    const s = await CourseSchedule.findByPk(req.params.id);
    if (!s) throw new AppError('排期不存在', 404);
    const cnt = await Booking.count({ where: { schedule_id: s.id } });
    if (cnt > 0) throw new AppError('已有预约，无法删除，请先取消排期', 400);
    await s.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}
