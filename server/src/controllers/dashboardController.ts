import { Op, fn, col, literal } from 'sequelize';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import {
  sequelize, Member, Membership, Order, Product,
  CourseSchedule, Course, Booking,
} from '../models/index.js';
import { success } from '../utils/response.js';

// 近 7 天营收趋势
export async function revenueTrend(_req: Request, res: Response, next: NextFunction) {
  try {
    const days: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').toDate();
      const end = d.endOf('day').toDate();
      const result: any = await Order.findOne({
        attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'revenue']],
        where: { created_at: { [Op.between]: [start, end] }, status: 'PAID' },
        raw: true,
      });
      days.push({ date: d.format('MM-DD'), revenue: Number(result?.revenue || 0) });
    }
    res.json(success(days));
  } catch (err) { next(err); }
}

// 热门课程 TOP5（按预约人次）
export async function hotCourses(_req: Request, res: Response, next: NextFunction) {
  try {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const rows: any[] = await Booking.findAll({
      attributes: [[fn('COUNT', col('Booking.id')), 'booking_count']],
      include: [{
        model: CourseSchedule,
        as: 'schedule',
        attributes: [],
        where: { start_time: { [Op.gte]: thirtyDaysAgo } },
        required: true,
        include: [{
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'type'],
          required: true,
        }],
      }],
      where: { status: { [Op.ne]: 'CANCELLED' } },
      group: ['schedule.course.id'],
      order: [[fn('COUNT', col('Booking.id')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });
    const result = rows.map((r) => ({
      name: r.schedule?.course?.name || '未知',
      type: r.schedule?.course?.type || '',
      count: Number(r.booking_count),
    }));
    res.json(success(result));
  } catch (err) { next(err); }
}

// 库存预警列表
export async function stockAlerts(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await Product.findAll({
      where: {
        status: 1,
        stock_alert: { [Op.not]: null },
        [Op.and]: literal('`stock` <= `stock_alert`'),
      },
      order: [['stock', 'ASC']],
      limit: 10,
    });
    res.json(success(rows));
  } catch (err) { next(err); }
}

// 会员近 6 月增长
export async function memberGrowth(_req: Request, res: Response, next: NextFunction) {
  try {
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = dayjs().subtract(i, 'month');
      const start = m.startOf('month').toDate();
      const end = m.endOf('month').toDate();
      const count = await Member.count({ where: { created_at: { [Op.between]: [start, end] } } });
      months.push({ month: m.format('YYYY-MM'), count });
    }
    res.json(success(months));
  } catch (err) { next(err); }
}
