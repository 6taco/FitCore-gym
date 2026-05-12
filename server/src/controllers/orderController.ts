import { Op, fn, col, literal } from 'sequelize';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import {
  sequelize, Order, OrderItem, Payment, Product, Member, User,
  Membership, MembershipPlan, Course,
} from '../models/index.js';
import { success, AppError } from '../utils/response.js';
import { genNo } from '../utils/idGen.js';

// ========== 收银台：创建订单并支付 ==========
const checkoutSchema = z.object({
  member_id: z.number().int().positive().optional().nullable(),
  items: z.array(z.object({
    item_type: z.enum(['PRODUCT', 'MEMBERSHIP', 'PERSONAL']),
    item_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
  payments: z.array(z.object({
    method: z.enum(['CASH', 'WECHAT', 'ALIPAY', 'CARD', 'STORED']),
    amount: z.number().positive(),
    trade_no: z.string().optional().nullable(),
  })).min(1),
  remark: z.string().max(255).optional().nullable(),
});

export async function checkout(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const data = checkoutSchema.parse(req.body);

    const orderItems: any[] = [];
    let totalAmount = 0;

    for (const it of data.items) {
      if (it.item_type === 'PRODUCT') {
        const p = await Product.findByPk(it.item_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!p || p.status !== 1) throw new AppError(`商品 ${it.item_id} 不可用`, 400);
        if (p.stock < it.quantity) throw new AppError(`${p.name} 库存不足（剩 ${p.stock}）`, 400);
        const subtotal = Number(p.price) * it.quantity;
        orderItems.push({
          item_type: 'PRODUCT',
          item_id: p.id,
          item_name: p.name,
          quantity: it.quantity,
          unit_price: p.price,
          subtotal,
        });
        totalAmount += subtotal;
        p.stock -= it.quantity;
        await p.save({ transaction: t });
      } else if (it.item_type === 'MEMBERSHIP') {
        const plan = await MembershipPlan.findByPk(it.item_id, { transaction: t });
        if (!plan || plan.status !== 1) throw new AppError(`卡种 ${it.item_id} 不可用`, 400);
        const subtotal = Number(plan.price) * it.quantity;
        orderItems.push({
          item_type: 'MEMBERSHIP',
          item_id: plan.id,
          item_name: plan.name,
          quantity: it.quantity,
          unit_price: plan.price,
          subtotal,
        });
        totalAmount += subtotal;
      } else if (it.item_type === 'PERSONAL') {
        const course = await Course.findByPk(it.item_id, { transaction: t });
        if (!course || course.status !== 1) throw new AppError(`私教课程 ${it.item_id} 不可用`, 400);
        if (course.type !== 'PERSONAL') throw new AppError(`课程 ${course.name} 不是私教课`, 400);
        const coursePrice = Number(course.price || 0);
        const subtotal = coursePrice * it.quantity;
        orderItems.push({
          item_type: 'PERSONAL',
          item_id: course.id,
          item_name: course.name,
          quantity: it.quantity,
          unit_price: coursePrice,
          subtotal,
        });
        totalAmount += subtotal;
      }
    }

    const paidTotal = data.payments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(paidTotal - totalAmount) > 0.01) {
      throw new AppError(`支付金额 ${paidTotal} 与应付 ${totalAmount} 不符`, 400);
    }

    for (const pay of data.payments) {
      if (pay.method === 'STORED') {
        if (!data.member_id) throw new AppError('储值卡支付需指定会员', 400);
        const card = await Membership.findOne({
          where: { member_id: data.member_id, status: 'ACTIVE' },
          include: [{ model: MembershipPlan, as: 'plan', where: { type: 'STORED' }, required: true }],
          order: [['balance', 'DESC']],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!card || Number(card.balance) < pay.amount) {
          throw new AppError('储值卡余额不足', 400);
        }
        card.balance = Number(card.balance) - pay.amount;
        await card.save({ transaction: t });
      }
    }

    const order = await Order.create({
      order_no: genNo('O'),
      member_id: data.member_id || null,
      operator_id: req.user?.id || null,
      total_amount: totalAmount,
      paid_amount: paidTotal,
      status: 'PAID',
      remark: data.remark || null,
    }, { transaction: t });

    for (const oi of orderItems) {
      await OrderItem.create({ ...oi, order_id: order.id }, { transaction: t });
    }
    for (const pay of data.payments) {
      await Payment.create({
        order_id: order.id,
        method: pay.method,
        amount: pay.amount,
        trade_no: pay.trade_no || null,
        status: 'SUCCESS',
      }, { transaction: t });
    }

    for (const oi of orderItems) {
      if (oi.item_type === 'MEMBERSHIP' && data.member_id) {
        const plan: any = await MembershipPlan.findByPk(oi.item_id, { transaction: t });
        for (let i = 0; i < oi.quantity; i++) {
          const start = dayjs();
          let endDate: string | null = null;
          let remaining: number | null = null;
          let balance: number | null = null;
          if (plan.type === 'PERIOD') endDate = start.add(plan.duration_days, 'day').format('YYYY-MM-DD');
          if (plan.type === 'COUNT') { remaining = plan.total_count; endDate = start.add(365, 'day').format('YYYY-MM-DD'); }
          if (plan.type === 'STORED') balance = plan.initial_balance;
          await Membership.create({
            member_id: data.member_id,
            plan_id: plan.id,
            card_no: genNo('C'),
            start_date: start.format('YYYY-MM-DD'),
            end_date: endDate,
            remaining_count: remaining,
            balance,
            status: 'ACTIVE',
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.json(success({ id: order.id, order_no: order.order_no, total_amount: totalAmount }, '收银成功'));
  } catch (err: any) {
    await t.rollback();
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

// ========== 创建待支付订单（微信/支付宝二维码支付） ==========
export async function createPendingOrder(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const data = checkoutSchema.parse(req.body);

    const orderItems: any[] = [];
    let totalAmount = 0;

    for (const it of data.items) {
      if (it.item_type === 'PRODUCT') {
        const p = await Product.findByPk(it.item_id, { transaction: t });
        if (!p || p.status !== 1) throw new AppError(`商品 ${it.item_id} 不可用`, 400);
        if (p.stock < it.quantity) throw new AppError(`${p.name} 库存不足（剩 ${p.stock}）`, 400);
        orderItems.push({ item_type: 'PRODUCT', item_id: p.id, item_name: p.name, quantity: it.quantity, unit_price: p.price, subtotal: Number(p.price) * it.quantity });
        totalAmount += Number(p.price) * it.quantity;
      } else if (it.item_type === 'MEMBERSHIP') {
        const plan = await MembershipPlan.findByPk(it.item_id, { transaction: t });
        if (!plan || plan.status !== 1) throw new AppError(`卡种 ${it.item_id} 不可用`, 400);
        orderItems.push({ item_type: 'MEMBERSHIP', item_id: plan.id, item_name: plan.name, quantity: it.quantity, unit_price: plan.price, subtotal: Number(plan.price) * it.quantity });
        totalAmount += Number(plan.price) * it.quantity;
      } else if (it.item_type === 'PERSONAL') {
        const course = await Course.findByPk(it.item_id, { transaction: t });
        if (!course || course.status !== 1) throw new AppError(`私教课程 ${it.item_id} 不可用`, 400);
        if (course.type !== 'PERSONAL') throw new AppError(`课程 ${course.name} 不是私教课`, 400);
        const price = Number(course.price || 0);
        orderItems.push({ item_type: 'PERSONAL', item_id: course.id, item_name: course.name, quantity: it.quantity, unit_price: price, subtotal: price * it.quantity });
        totalAmount += price * it.quantity;
      }
    }

    const paidTotal = data.payments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(paidTotal - totalAmount) > 0.01) {
      throw new AppError(`支付金额 ${paidTotal} 与应付 ${totalAmount} 不符`, 400);
    }

    const order = await Order.create({
      order_no: genNo('O'),
      member_id: data.member_id || null,
      operator_id: req.user?.id || null,
      total_amount: totalAmount,
      paid_amount: 0,
      status: 'PENDING',
      remark: data.remark || null,
    }, { transaction: t });

    for (const oi of orderItems) {
      await OrderItem.create({ ...oi, order_id: order.id }, { transaction: t });
    }
    for (const pay of data.payments) {
      await Payment.create({
        order_id: order.id,
        method: pay.method,
        amount: pay.amount,
        trade_no: null,
        status: 'PENDING',
      }, { transaction: t });
    }

    await t.commit();
    res.json(success({ id: order.id, order_no: order.order_no, total_amount: totalAmount }, '订单已创建，等待支付'));
  } catch (err: any) {
    await t.rollback();
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

// ========== 模拟支付确认 ==========
export async function confirmPayment(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const order: any = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }, { model: Payment, as: 'payments' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) throw new AppError('订单不存在', 404);
    if (order.status !== 'PENDING') throw new AppError('该订单不是待支付状态', 400);

    for (const item of order.items) {
      if (item.item_type === 'PRODUCT') {
        const p = await Product.findByPk(item.item_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!p) throw new AppError(`商品不存在`, 400);
        if (p.stock < item.quantity) throw new AppError(`${p.name} 库存不足`, 400);
        p.stock -= item.quantity;
        await p.save({ transaction: t });
      }
    }

    for (const pay of order.payments) {
      if (pay.method === 'STORED') {
        if (!order.member_id) throw new AppError('储值卡支付需指定会员', 400);
        const card = await Membership.findOne({
          where: { member_id: order.member_id, status: 'ACTIVE' },
          include: [{ model: MembershipPlan, as: 'plan', where: { type: 'STORED' }, required: true }],
          order: [['balance', 'DESC']],
          transaction: t, lock: t.LOCK.UPDATE,
        });
        if (!card || Number(card.balance) < Number(pay.amount)) throw new AppError('储值卡余额不足', 400);
        card.balance = Number(card.balance) - Number(pay.amount);
        await card.save({ transaction: t });
      }
    }

    for (const pay of order.payments) {
      pay.status = 'SUCCESS';
      pay.trade_no = `SIM${Date.now()}${Math.floor(Math.random() * 10000)}`;
      await pay.save({ transaction: t });
    }

    order.status = 'PAID';
    order.paid_amount = order.total_amount;
    await order.save({ transaction: t });

    for (const oi of order.items) {
      if (oi.item_type === 'MEMBERSHIP' && order.member_id) {
        const plan: any = await MembershipPlan.findByPk(oi.item_id, { transaction: t });
        for (let i = 0; i < oi.quantity; i++) {
          const start = dayjs();
          let endDate: string | null = null, remaining: number | null = null, balance: number | null = null;
          if (plan.type === 'PERIOD') endDate = start.add(plan.duration_days, 'day').format('YYYY-MM-DD');
          if (plan.type === 'COUNT') { remaining = plan.total_count; endDate = start.add(365, 'day').format('YYYY-MM-DD'); }
          if (plan.type === 'STORED') balance = plan.initial_balance;
          await Membership.create({
            member_id: order.member_id, plan_id: plan.id,
            card_no: genNo('C'), start_date: start.format('YYYY-MM-DD'),
            end_date: endDate, remaining_count: remaining, balance, status: 'ACTIVE',
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.json(success({ id: order.id, order_no: order.order_no }, '支付成功'));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

// ========== 查询订单状态 ==========
export async function orderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const o = await Order.findByPk(req.params.id, { attributes: ['id', 'order_no', 'status', 'total_amount', 'paid_amount'] });
    if (!o) throw new AppError('订单不存在', 404);
    res.json(success(o));
  } catch (err) { next(err); }
}

// ========== 订单列表 ==========
export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 20, status, keyword, start, end } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (keyword) where[Op.or] = [
      { order_no: { [Op.like]: `%${keyword}%` } },
    ];
    if (start || end) {
      where.created_at = {} as any;
      if (start) where.created_at[Op.gte] = dayjs(start as string).startOf('day').toDate();
      if (end) where.created_at[Op.lte] = dayjs(end as string).endOf('day').toDate();
    }
    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        { model: Member, as: 'member', attributes: ['id', 'name', 'member_no', 'phone'] },
        { model: User, as: 'operator', attributes: ['id', 'username', 'real_name'] },
      ],
      order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
    res.json(success({ list: rows, total: count, page: Number(page), pageSize: Number(pageSize) }));
  } catch (err) { next(err); }
}

// ========== 订单详情 ==========
export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const o = await Order.findByPk(req.params.id, {
      include: [
        { model: Member, as: 'member', attributes: ['id', 'name', 'member_no', 'phone'] },
        { model: User, as: 'operator', attributes: ['id', 'username', 'real_name'] },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payments' },
      ],
    });
    if (!o) throw new AppError('订单不存在', 404);
    res.json(success(o));
  } catch (err) { next(err); }
}

// ========== 退款 ==========
export async function refundOrder(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const o: any = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }, { model: Payment, as: 'payments' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!o) throw new AppError('订单不存在', 404);
    if (o.status !== 'PAID') throw new AppError('只能退款已支付订单', 400);

    for (const item of o.items) {
      if (item.item_type === 'PRODUCT' && item.item_id) {
        const p = await Product.findByPk(item.item_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (p) { p.stock += item.quantity; await p.save({ transaction: t }); }
      }
    }

    for (const pay of o.payments) {
      if (pay.method === 'STORED' && pay.status === 'SUCCESS' && o.member_id) {
        const card = await Membership.findOne({
          where: { member_id: o.member_id, status: 'ACTIVE' },
          include: [{ model: MembershipPlan, as: 'plan', where: { type: 'STORED' }, required: true }],
          order: [['balance', 'DESC']],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (card) {
          card.balance = Number(card.balance) + Number(pay.amount);
          await card.save({ transaction: t });
        }
      }
    }

    for (const pay of o.payments) {
      pay.status = 'REFUNDED';
      await pay.save({ transaction: t });
    }

    o.status = 'REFUNDED';
    await o.save({ transaction: t });
    await t.commit();
    res.json(success(null, '退款成功'));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}
