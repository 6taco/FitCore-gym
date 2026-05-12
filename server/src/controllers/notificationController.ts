import { Op } from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 20, is_read } = req.query;
    const where: any = { user_id: req.user!.id };
    if (is_read !== undefined && is_read !== '') where.is_read = Number(is_read);
    const { rows, count } = await Notification.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
    res.json(success({ list: rows, total: count, page: Number(page), pageSize: Number(pageSize) }));
  } catch (err) { next(err); }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await Notification.count({ where: { user_id: req.user!.id, is_read: 0 } });
    res.json(success({ count }));
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) throw new AppError('请提供通知 ID 列表', 400);
    await Notification.update({ is_read: 1 }, {
      where: { id: { [Op.in]: ids }, user_id: req.user!.id },
    });
    res.json(success(null, '已标记已读'));
  } catch (err) { next(err); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const [affected] = await Notification.update({ is_read: 1 }, {
      where: { user_id: req.user!.id, is_read: 0 },
    });
    res.json(success({ affected }, `已全部标记已读`));
  } catch (err) { next(err); }
}
