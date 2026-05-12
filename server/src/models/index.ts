import { sequelize } from '../config/db.js';
import User from './User.js';
import Role from './Role.js';
import Permission from './Permission.js';
import RolePermission from './RolePermission.js';
import AuditLog from './AuditLog.js';
import Member from './Member.js';
import BodyMeasurement from './BodyMeasurement.js';
import MembershipPlan from './MembershipPlan.js';
import Membership from './Membership.js';
import Coach from './Coach.js';
import Course from './Course.js';
import CourseSchedule from './CourseSchedule.js';
import Booking from './Booking.js';
import Product from './Product.js';
import StockMovement from './StockMovement.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Payment from './Payment.js';
import Notification from './Notification.js';
import CheckIn from './CheckIn.js';
import CourseReview from './CourseReview.js';
import Setting from './Setting.js';

// 用户-角色
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// 角色-权限（通过 role_permissions）
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

// 会员-体测
Member.hasMany(BodyMeasurement, { foreignKey: 'member_id', as: 'measurements' });
BodyMeasurement.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });

// 会员-会员卡-卡种
Member.hasMany(Membership, { foreignKey: 'member_id', as: 'memberships' });
Membership.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });
Membership.belongsTo(MembershipPlan, { foreignKey: 'plan_id', as: 'plan' });
MembershipPlan.hasMany(Membership, { foreignKey: 'plan_id', as: 'memberships' });

// 会员 <-> 用户账号（可空）
Member.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 教练-用户
Coach.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 课程-排期-预约
Course.hasMany(CourseSchedule, { foreignKey: 'course_id', as: 'schedules' });
CourseSchedule.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
CourseSchedule.belongsTo(Coach, { foreignKey: 'coach_id', as: 'coach' });
Coach.hasMany(CourseSchedule, { foreignKey: 'coach_id', as: 'schedules' });

CourseSchedule.hasMany(Booking, { foreignKey: 'schedule_id', as: 'bookings' });
Booking.belongsTo(CourseSchedule, { foreignKey: 'schedule_id', as: 'schedule' });
Booking.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });
Member.hasMany(Booking, { foreignKey: 'member_id', as: 'bookings' });

// 商品-库存流水
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
StockMovement.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

// 课程评价
CourseReview.belongsTo(CourseSchedule, { foreignKey: 'schedule_id', as: 'schedule' });
CourseReview.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });
CourseSchedule.hasMany(CourseReview, { foreignKey: 'schedule_id', as: 'reviews' });

// 入场签到
CheckIn.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });
Member.hasMany(CheckIn, { foreignKey: 'member_id', as: 'checkIns' });
CheckIn.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

// 通知
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// 订单
Order.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });
Order.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

export {
  sequelize,
  User, Role, Permission, RolePermission, AuditLog,
  Member, BodyMeasurement, MembershipPlan, Membership,
  Coach, Course, CourseSchedule, Booking,
  Product, StockMovement, Order, OrderItem, Payment,
  Notification, CheckIn, CourseReview, Setting,
};
