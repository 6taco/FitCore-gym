import { Op, fn, col } from 'sequelize';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import { sequelize, Order, Payment } from '../models/index.js';
import { success } from '../utils/response.js';

// 日报 / 月报 统一接口
export async function dailySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.query;
    const d = date ? dayjs(date as string) : dayjs();
    const start = d.startOf('day').toDate();
    const end = d.endOf('day').toDate();

    const orders = await Order.findAll({
      where: { created_at: { [Op.between]: [start, end] }, status: { [Op.in]: ['PAID', 'REFUNDED'] } },
    });

    const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + Number(o.total_amount), 0);
    const refundTotal = orders.filter(o => o.status === 'REFUNDED').reduce((s, o) => s + Number(o.total_amount), 0);
    const orderCount = orders.filter(o => o.status === 'PAID').length;
    const refundCount = orders.filter(o => o.status === 'REFUNDED').length;

    const payments: any[] = await Payment.findAll({
      attributes: ['method', [fn('SUM', col('amount')), 'total']],
      include: [{
        model: Order,
        as: 'order',
        attributes: [],
        where: { created_at: { [Op.between]: [start, end] }, status: 'PAID' },
        required: true,
      }],
      where: { status: 'SUCCESS' },
      group: ['method'],
      raw: true,
    });

    res.json(success({
      date: d.format('YYYY-MM-DD'),
      totalRevenue,
      refundTotal,
      netRevenue: totalRevenue - refundTotal,
      orderCount,
      refundCount,
      paymentMethods: payments.map(p => ({ method: p.method, total: Number(p.total) })),
    }));
  } catch (err) { next(err); }
}

export async function monthlySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { month } = req.query;
    const m = month ? dayjs(month + '-01') : dayjs().startOf('month');
    const start = m.startOf('month').toDate();
    const end = m.endOf('month').toDate();

    const orders = await Order.findAll({
      where: { created_at: { [Op.between]: [start, end] }, status: { [Op.in]: ['PAID', 'REFUNDED'] } },
    });

    const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + Number(o.total_amount), 0);
    const refundTotal = orders.filter(o => o.status === 'REFUNDED').reduce((s, o) => s + Number(o.total_amount), 0);
    const orderCount = orders.filter(o => o.status === 'PAID').length;

    const dailyTrend: { date: string; revenue: number; count: number }[] = [];
    const daysInMonth = m.daysInMonth();
    for (let i = 1; i <= daysInMonth; i++) {
      const day = m.date(i);
      const dayStart = day.startOf('day').toDate();
      const dayEnd = day.endOf('day').toDate();
      const dayOrders = orders.filter(o =>
        o.status === 'PAID' && new Date(o.created_at as any) >= dayStart && new Date(o.created_at as any) <= dayEnd
      );
      dailyTrend.push({
        date: day.format('YYYY-MM-DD'),
        revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
        count: dayOrders.length,
      });
    }

    res.json(success({
      month: m.format('YYYY-MM'),
      totalRevenue,
      refundTotal,
      netRevenue: totalRevenue - refundTotal,
      orderCount,
      dailyTrend,
    }));
  } catch (err) { next(err); }
}

// Dashboard 用：本月营收
export async function monthRevenue(_req: Request, res: Response, next: NextFunction) {
  try {
    const start = dayjs().startOf('month').toDate();
    const end = dayjs().endOf('month').toDate();
    const result: any = await Order.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'revenue']],
      where: { created_at: { [Op.between]: [start, end] }, status: 'PAID' },
      raw: true,
    });
    res.json(success({ revenue: Number(result?.revenue || 0) }));
  } catch (err) { next(err); }
}
