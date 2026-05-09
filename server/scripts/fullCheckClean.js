import { Op } from 'sequelize';
import {
  sequelize,
  User, Role, RolePermission,
  Member, BodyMeasurement, MembershipPlan, Membership,
  Coach, Course, CourseSchedule, Booking, CourseReview,
  Product, StockMovement, Order, OrderItem, Payment,
  Notification, CheckIn, Setting,
} from '../src/models/index.js';

const PLAN_PREFIX = 'FC-';
const COURSE_PREFIX = 'FC-';
const PRODUCT_PREFIX = 'FC-PRD-';
const ROLE_PREFIX = 'fc_role_';
const USER_PREFIXES = ['fcsys', 'fcmem'];
const MEMBER_TAG = 'full-check';
const COACH_SPECIALTY = 'full-check';

function log(msg) {
  console.log(`[full-check-clean] ${msg}`);
}

async function clean() {
  log('连接数据库…');
  await sequelize.authenticate();

  const t = await sequelize.transaction();
  try {
    // ── 1. 找出所有巡检产生的根实体 ID ──────────────────────
    const fcPlans = await MembershipPlan.findAll({ where: { code: { [Op.like]: `${PLAN_PREFIX}%` } }, attributes: ['id'], transaction: t });
    const planIds = fcPlans.map((p) => p.id);

    const fcCourses = await Course.findAll({ where: { code: { [Op.like]: `${COURSE_PREFIX}%` } }, attributes: ['id'], transaction: t });
    const courseIds = fcCourses.map((c) => c.id);

    const fcProducts = await Product.findAll({ where: { code: { [Op.like]: `${PRODUCT_PREFIX}%` } }, attributes: ['id'], transaction: t });
    const productIds = fcProducts.map((p) => p.id);

    const fcMembers = await Member.findAll({ where: { tags: { [Op.like]: `%${MEMBER_TAG}%` } }, attributes: ['id', 'user_id'], transaction: t });
    const memberIds = fcMembers.map((m) => m.id);
    const memberUserIds = fcMembers.map((m) => m.user_id).filter(Boolean);

    const fcCoaches = await Coach.findAll({ where: { specialty: { [Op.like]: `%${COACH_SPECIALTY}%` } }, attributes: ['id', 'user_id'], transaction: t });
    const coachIds = fcCoaches.map((c) => c.id);
    const coachUserIds = fcCoaches.map((c) => c.user_id).filter(Boolean);

    const fcRoles = await Role.findAll({ where: { code: { [Op.like]: `${ROLE_PREFIX}%` } }, attributes: ['id'], transaction: t });
    const roleIds = fcRoles.map((r) => r.id);

    const userLikeClauses = USER_PREFIXES.map((p) => ({ username: { [Op.like]: `${p}%` } }));
    const fcUsers = await User.findAll({ where: { [Op.or]: userLikeClauses }, attributes: ['id', 'role_id'], transaction: t });
    const userIds = fcUsers.map((u) => u.id);
    const userRoleIds = fcUsers.map((u) => u.role_id).filter(Boolean);

    const allRoleIds = [...new Set([...roleIds, ...userRoleIds])];
    const allUserIds = [...new Set([...userIds, ...memberUserIds, ...coachUserIds])];

    const fcSchedules = await CourseSchedule.findAll({ where: { course_id: { [Op.in]: courseIds.length ? courseIds : [0] } }, attributes: ['id'], transaction: t });
    const scheduleIds = fcSchedules.map((s) => s.id);

    const fcOrders = await Order.findAll({ where: { member_id: { [Op.in]: memberIds.length ? memberIds : [0] } }, attributes: ['id'], transaction: t });
    const orderIds = fcOrders.map((o) => o.id);

    // ── 2. 按外键依赖逆序删除 ──────────────────────────────
    let count;

    // 课程评价
    if (scheduleIds.length) {
      count = await CourseReview.destroy({ where: { schedule_id: { [Op.in]: scheduleIds } }, transaction: t });
      if (count) log(`课程评价 × ${count}`);
    }

    // 预约
    if (scheduleIds.length) {
      count = await Booking.destroy({ where: { schedule_id: { [Op.in]: scheduleIds } }, transaction: t });
      if (count) log(`预约 × ${count}`);
    }
    if (memberIds.length) {
      count = await Booking.destroy({ where: { member_id: { [Op.in]: memberIds } }, transaction: t });
      if (count) log(`预约(按会员) × ${count}`);
    }

    // 通知
    if (allUserIds.length) {
      count = await Notification.destroy({ where: { user_id: { [Op.in]: allUserIds } }, transaction: t });
      if (count) log(`通知 × ${count}`);
    }

    // 签到
    if (memberIds.length) {
      count = await CheckIn.destroy({ where: { member_id: { [Op.in]: memberIds } }, transaction: t });
      if (count) log(`签到 × ${count}`);
    }

    // 订单子表
    if (orderIds.length) {
      count = await Payment.destroy({ where: { order_id: { [Op.in]: orderIds } }, transaction: t });
      if (count) log(`支付记录 × ${count}`);
      count = await OrderItem.destroy({ where: { order_id: { [Op.in]: orderIds } }, transaction: t });
      if (count) log(`订单明细 × ${count}`);
      count = await Order.destroy({ where: { id: { [Op.in]: orderIds } }, transaction: t });
      if (count) log(`订单 × ${count}`);
    }

    // 库存流水
    if (productIds.length) {
      count = await StockMovement.destroy({ where: { product_id: { [Op.in]: productIds } }, transaction: t });
      if (count) log(`库存流水 × ${count}`);
    }

    // 排期
    if (scheduleIds.length) {
      count = await CourseSchedule.destroy({ where: { id: { [Op.in]: scheduleIds } }, transaction: t });
      if (count) log(`排期 × ${count}`);
    }

    // 体测
    if (memberIds.length) {
      count = await BodyMeasurement.destroy({ where: { member_id: { [Op.in]: memberIds } }, transaction: t });
      if (count) log(`体测 × ${count}`);
    }

    // 会籍卡
    if (memberIds.length) {
      count = await Membership.destroy({ where: { member_id: { [Op.in]: memberIds } }, transaction: t });
      if (count) log(`会籍卡 × ${count}`);
    }
    if (planIds.length) {
      count = await Membership.destroy({ where: { plan_id: { [Op.in]: planIds } }, transaction: t });
      if (count) log(`会籍卡(按卡种) × ${count}`);
    }

    // 会员
    if (memberIds.length) {
      count = await Member.destroy({ where: { id: { [Op.in]: memberIds } }, transaction: t });
      if (count) log(`会员 × ${count}`);
    }

    // 教练
    if (coachIds.length) {
      count = await Coach.destroy({ where: { id: { [Op.in]: coachIds } }, transaction: t });
      if (count) log(`教练 × ${count}`);
    }

    // 商品
    if (productIds.length) {
      count = await Product.destroy({ where: { id: { [Op.in]: productIds } }, transaction: t });
      if (count) log(`商品 × ${count}`);
    }

    // 卡种
    if (planIds.length) {
      count = await MembershipPlan.destroy({ where: { id: { [Op.in]: planIds } }, transaction: t });
      if (count) log(`卡种 × ${count}`);
    }

    // 课程
    if (courseIds.length) {
      count = await Course.destroy({ where: { id: { [Op.in]: courseIds } }, transaction: t });
      if (count) log(`课程 × ${count}`);
    }

    // 用户
    if (userIds.length) {
      count = await User.destroy({ where: { id: { [Op.in]: userIds } }, transaction: t });
      if (count) log(`用户 × ${count}`);
    }

    // 角色-权限
    if (allRoleIds.length) {
      count = await RolePermission.destroy({ where: { role_id: { [Op.in]: allRoleIds } }, transaction: t });
      if (count) log(`角色权限 × ${count}`);
    }

    // 角色
    if (allRoleIds.length) {
      count = await Role.destroy({ where: { id: { [Op.in]: allRoleIds } }, transaction: t });
      if (count) log(`角色 × ${count}`);
    }

    await t.commit();
    log('✅ 清理完成');
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

clean()
  .catch((err) => {
    console.error('\n[full-check-clean] ❌ 清理失败');
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await sequelize.close(); } catch {}
  });
