import { Op } from 'sequelize';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sequelize, Product, StockMovement, User } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const schema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(1).max(64),
  category: z.string().max(32).optional().nullable(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative().optional(),
  stock_alert: z.number().int().nonnegative().optional().nullable(),
  unit: z.string().max(16).optional().nullable(),
  status: z.number().int().min(0).max(1).optional(),
});

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 20, keyword, category, status, warn } = req.query;
    const where: any = {};
    if (keyword) where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { code: { [Op.like]: `%${keyword}%` } },
    ];
    if (category) where.category = category;
    if (status !== undefined && status !== '') where.status = Number(status);
    if (warn === '1') where.stock = { [Op.lte]: sequelize.col('stock_alert') };
    const { rows, count } = await Product.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
    res.json(success({ list: rows, total: count, page: Number(page), pageSize: Number(pageSize) }));
  } catch (err) { next(err); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = schema.parse(req.body);
    const exists = await Product.findOne({ where: { code: data.code } });
    if (exists) throw new AppError('商品编码已存在', 400);
    const p = await Product.create({ ...data, status: data.status ?? 1 } as any);
    res.json(success({ id: p.id }, '已创建'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = schema.partial().parse(req.body);
    const p = await Product.findByPk(req.params.id);
    if (!p) throw new AppError('商品不存在', 404);
    if (data.code && data.code !== p.code) {
      const dup = await Product.findOne({ where: { code: data.code } });
      if (dup) throw new AppError('商品编码已存在', 400);
    }
    await p.update(data);
    res.json(success(null, '已更新'));
  } catch (err: any) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) throw new AppError('商品不存在', 404);
    await p.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}

// 库存变动（入库 / 出库 / 盘点调整）
export async function stockChange(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { type, quantity, reason } = req.body;
    if (!['IN', 'OUT', 'ADJUST'].includes(type)) throw new AppError('type 无效', 400);
    if (!Number.isInteger(quantity) || quantity === 0) throw new AppError('quantity 无效', 400);
    const p = await Product.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!p) throw new AppError('商品不存在', 404);
    const before = p.stock;
    let after: number;
    if (type === 'ADJUST') {
      after = quantity;
    } else {
      after = type === 'IN' ? before + quantity : before - quantity;
    }
    if (after < 0) throw new AppError('库存不足', 400);
    p.stock = after;
    await p.save({ transaction: t });
    await StockMovement.create({
      product_id: p.id,
      type,
      quantity: type === 'ADJUST' ? after - before : quantity,
      before_stock: before,
      after_stock: after,
      remark: reason || null,
      operator_id: req.user?.id || null,
    }, { transaction: t });
    await t.commit();
    res.json(success({ stock: after }, '库存已更新'));
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

export async function stockMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await StockMovement.findAll({
      where: { product_id: req.params.id },
      include: [{ model: User, as: 'operator', attributes: ['id', 'username', 'real_name'] }],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json(success(rows));
  } catch (err) { next(err); }
}
