import { Op } from 'sequelize';
import { z } from 'zod';
import { Course, CourseSchedule } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const schema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(1).max(64),
  type: z.enum(['GROUP', 'PERSONAL']),
  duration_min: z.number().int().positive(),
  capacity: z.number().int().positive().optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  status: z.number().int().min(0).max(1).optional(),
});

export async function listCourses(req, res, next) {
  try {
    const { keyword, type, status } = req.query;
    const where = {};
    if (keyword) where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { code: { [Op.like]: `%${keyword}%` } },
    ];
    if (type) where.type = type;
    if (status !== undefined && status !== '') where.status = Number(status);
    const rows = await Course.findAll({ where, order: [['id', 'DESC']] });
    res.json(success(rows));
  } catch (err) { next(err); }
}

export async function createCourse(req, res, next) {
  try {
    const data = schema.parse(req.body);
    if (data.type === 'GROUP' && !data.capacity) throw new AppError('团课需填写容量', 400);
    if (data.type === 'PERSONAL' && !(data.price >= 0)) throw new AppError('私教课需填写单价', 400);
    const exists = await Course.findOne({ where: { code: data.code } });
    if (exists) throw new AppError('课程编码已存在', 400);
    const c = await Course.create({ ...data, status: data.status ?? 1 });
    res.json(success({ id: c.id }, '已创建'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const data = schema.partial().parse(req.body);
    const c = await Course.findByPk(req.params.id);
    if (!c) throw new AppError('课程不存在', 404);
    if (data.code && data.code !== c.code) {
      const dup = await Course.findOne({ where: { code: data.code } });
      if (dup) throw new AppError('课程编码已存在', 400);
    }
    await c.update(data);
    res.json(success(null, '已更新'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const c = await Course.findByPk(req.params.id);
    if (!c) throw new AppError('课程不存在', 404);
    const used = await CourseSchedule.count({ where: { course_id: c.id } });
    if (used > 0) throw new AppError(`该课程下有 ${used} 个排期，建议改为停用`, 400);
    await c.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}
