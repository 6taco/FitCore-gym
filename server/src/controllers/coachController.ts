import { Op, fn, col } from 'sequelize';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import { sequelize, Coach, CourseSchedule, Booking } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const schema = z.object({
  name: z.string().min(1).max(64),
  gender: z.number().int().min(0).max(2).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatar: z.string().max(255).optional().nullable(),
  specialty: z.string().max(255).optional().nullable(),
  intro: z.string().max(1000).optional().nullable(),
  hire_date: z.string().optional().nullable(),
  status: z.number().int().min(0).max(1).optional(),
});

export async function listCoaches(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const where: any = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { specialty: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined && status !== '') where.status = Number(status);
    const { rows, count } = await Coach.findAndCountAll({
      where, order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
    res.json(success({
      list: rows, total: count, page: Number(page), pageSize: Number(pageSize),
    }));
  } catch (err) { next(err); }
}

export async function getCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await Coach.findByPk(req.params.id);
    if (!c) throw new AppError('教练不存在', 404);
    res.json(success(c));
  } catch (err) { next(err); }
}

export async function createCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const data = schema.parse(req.body);
    const c = await Coach.create({ ...data, status: data.status ?? 1 } as any);
    res.json(success({ id: c.id }, '已创建'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function updateCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const data = schema.partial().parse(req.body);
    const c = await Coach.findByPk(req.params.id);
    if (!c) throw new AppError('教练不存在', 404);
    await c.update(data);
    res.json(success(null, '已更新'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deleteCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await Coach.findByPk(req.params.id);
    if (!c) throw new AppError('教练不存在', 404);
    const used = await CourseSchedule.count({ where: { coach_id: c.id } });
    if (used > 0) throw new AppError(`教练已有 ${used} 条排期记录，建议改为停用`, 400);
    await c.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}

export async function coachStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = req.query;
    const dateRange: any = {};
    if (start) dateRange[Op.gte] = dayjs(start as string).startOf('day').toDate();
    if (end) dateRange[Op.lte] = dayjs(end as string).endOf('day').toDate();
    const timeWhere = start || end ? { start_time: dateRange } : {};

    const coach = await Coach.findByPk(req.params.id);
    if (!coach) throw new AppError('教练不存在', 404);

    const schedules = await CourseSchedule.findAll({
      where: { coach_id: coach.id, ...timeWhere },
      attributes: ['id'],
    });
    const scheduleIds = schedules.map((s) => s.id);

    const totalSchedules = schedules.length;
    const totalBookings = scheduleIds.length
      ? await Booking.count({ where: { schedule_id: scheduleIds, status: { [Op.in]: ['BOOKED', 'CHECKED_IN'] } } })
      : 0;
    const checkedIn = scheduleIds.length
      ? await Booking.count({ where: { schedule_id: scheduleIds, status: 'CHECKED_IN' } })
      : 0;

    res.json(success({
      coach_id: coach.id,
      coach_name: coach.name,
      total_schedules: totalSchedules,
      total_bookings: totalBookings,
      total_checked_in: checkedIn,
    }));
  } catch (err) { next(err); }
}

export async function coachRanking(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = req.query;
    const coaches = await Coach.findAll({ where: { status: 1 }, order: [['id', 'ASC']] });
    const coachIds = coaches.map((c) => c.id);
    if (!coachIds.length) return res.json(success([]));

    const dateWhere: any = {};
    if (start) dateWhere[Op.gte] = dayjs(start as string).startOf('day').toDate();
    if (end) dateWhere[Op.lte] = dayjs(end as string).endOf('day').toDate();
    const timeFilter = start || end ? { start_time: dateWhere } : {};

    const schedules = await CourseSchedule.findAll({
      where: { coach_id: { [Op.in]: coachIds }, ...timeFilter },
      attributes: ['id', 'coach_id'],
    });
    const coachScheduleMap: Record<number, number[]> = {};
    const allSids: number[] = [];
    for (const s of schedules) {
      if (!coachScheduleMap[s.coach_id]) coachScheduleMap[s.coach_id] = [];
      coachScheduleMap[s.coach_id].push(s.id);
      allSids.push(s.id);
    }

    let bookingMap: Record<number, number> = {};
    let checkedInMap: Record<number, number> = {};
    if (allSids.length) {
      const [bookingRows] = await sequelize.query(
        `SELECT cs.coach_id, COUNT(*) AS cnt
         FROM bookings b JOIN course_schedules cs ON b.schedule_id = cs.id
         WHERE b.schedule_id IN (:sids) AND b.status IN ('BOOKED','CHECKED_IN')
         GROUP BY cs.coach_id`,
        { replacements: { sids: allSids } },
      );
      const bRows = Array.isArray(bookingRows) ? bookingRows : [];
      for (const r of bRows as any[]) bookingMap[r.coach_id] = Number(r.cnt);

      const [ciRows] = await sequelize.query(
        `SELECT cs.coach_id, COUNT(*) AS cnt
         FROM bookings b JOIN course_schedules cs ON b.schedule_id = cs.id
         WHERE b.schedule_id IN (:sids) AND b.status = 'CHECKED_IN'
         GROUP BY cs.coach_id`,
        { replacements: { sids: allSids } },
      );
      const cRows = Array.isArray(ciRows) ? ciRows : [];
      for (const r of cRows as any[]) checkedInMap[r.coach_id] = Number(r.cnt);
    }

    const result = coaches.map((c) => {
      const totalSchedules = (coachScheduleMap[c.id] || []).length;
      const totalBookings = bookingMap[c.id] || 0;
      const totalCheckedIn = checkedInMap[c.id] || 0;
      return {
        coach_id: c.id,
        coach_name: c.name,
        specialty: c.specialty,
        avatar: c.avatar,
        total_schedules: totalSchedules,
        total_bookings: totalBookings,
        total_checked_in: totalCheckedIn,
        attendance_rate: totalBookings > 0 ? Math.round((totalCheckedIn / totalBookings) * 100) : 0,
      };
    });
    result.sort((a, b) => b.total_checked_in - a.total_checked_in);
    res.json(success(result));
  } catch (err) { next(err); }
}
