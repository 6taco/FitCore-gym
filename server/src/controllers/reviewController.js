import { z } from 'zod';
import { Op } from 'sequelize';
import { CourseReview, CourseSchedule, Member, Course, Coach } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

const schema = z.object({
  schedule_id: z.number().int().positive(),
  member_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  content: z.string().max(500).optional().nullable(),
});

export async function createReview(req, res, next) {
  try {
    const data = schema.parse(req.body);
    const schedule = await CourseSchedule.findByPk(data.schedule_id);
    if (!schedule) throw new AppError('排期不存在', 404);

    const exists = await CourseReview.findOne({
      where: { schedule_id: data.schedule_id, member_id: data.member_id },
    });
    if (exists) throw new AppError('该会员已对此课程评价过', 400);

    const r = await CourseReview.create(data);
    res.json(success({ id: r.id }, '评价成功'));
  } catch (err) {
    if (err.name === 'ZodError') return next(new AppError(err.issues[0].message, 400));
    next(err);
  }
}

export async function listReviews(req, res, next) {
  try {
    const { page = 1, pageSize = 20, schedule_id, member_id, course_id } = req.query;
    const where = {};
    if (schedule_id) where.schedule_id = Number(schedule_id);
    if (member_id) where.member_id = Number(member_id);

    const include = [
      { model: Member, as: 'member', attributes: ['id', 'name', 'member_no', 'avatar'] },
      {
        model: CourseSchedule, as: 'schedule',
        attributes: ['id', 'start_time', 'course_id', 'coach_id'],
        include: [
          { model: Course, as: 'course', attributes: ['id', 'name'] },
          { model: Coach, as: 'coach', attributes: ['id', 'name'] },
        ],
        ...(course_id ? { where: { course_id: Number(course_id) }, required: true } : {}),
      },
    ];

    const { rows, count } = await CourseReview.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
    res.json(success({ list: rows, total: count, page: Number(page), pageSize: Number(pageSize) }));
  } catch (err) { next(err); }
}

export async function deleteReview(req, res, next) {
  try {
    const r = await CourseReview.findByPk(req.params.id);
    if (!r) throw new AppError('评价不存在', 404);
    await r.destroy();
    res.json(success(null, '已删除'));
  } catch (err) { next(err); }
}
