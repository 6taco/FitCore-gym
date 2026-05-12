import { Op } from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/index.js';
import { success } from '../utils/response.js';

export async function listAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 20, module, action, keyword, startTime, endTime } = req.query;
    const where: any = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { target_id: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (startTime || endTime) {
      where.created_at = {} as any;
      if (startTime) where.created_at[Op.gte] = new Date(startTime as string);
      if (endTime) where.created_at[Op.lte] = new Date(endTime as string);
    }
    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
    res.json(success({
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    }));
  } catch (err) { next(err); }
}
