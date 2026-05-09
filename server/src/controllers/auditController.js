import { Op } from 'sequelize';
import { AuditLog } from '../models/index.js';
import { success } from '../utils/response.js';

export async function listAuditLogs(req, res, next) {
  try {
    const { page = 1, pageSize = 20, module, action, keyword, startTime, endTime } = req.query;
    const where = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { target_id: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = new Date(startTime);
      if (endTime) where.created_at[Op.lte] = new Date(endTime);
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
