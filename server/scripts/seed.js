import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import {
  sequelize, User, Role, Permission, Member, MembershipPlan,
  Coach, Course, CourseSchedule, Product,
} from '../src/models/index.js';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../src/constants/permissions.js';
import { genNo } from '../src/utils/idGen.js';
import logger from '../src/utils/logger.js';

const ROLES = [
  { code: 'admin',  name: '系统管理员', description: '拥有全部权限' },
  { code: 'staff',  name: '前台/员工',   description: '处理日常业务' },
  { code: 'coach',  name: '教练',        description: '课程与学员' },
  { code: 'member', name: '会员',        description: '普通会员' },
];

const USERS = [
  { username: 'admin',  password: 'admin123',  real_name: '超级管理员', roleCode: 'admin'  },
  { username: 'staff',  password: 'staff123',  real_name: '前台小王',   roleCode: 'staff'  },
  { username: 'coach',  password: 'coach123',  real_name: '王教练',     roleCode: 'coach'  },
  { username: 'member', password: 'member123', real_name: '张三',       roleCode: 'member' },
];

async function run() {
  await sequelize.authenticate();
  logger.info('开始写入种子数据...');

  const roleMap = {};
  const roleInstances = {};
  for (const r of ROLES) {
    const [role] = await Role.findOrCreate({ where: { code: r.code }, defaults: r });
    roleMap[r.code] = role.id;
    roleInstances[r.code] = role;
  }
  logger.info(`角色: ${Object.keys(roleMap).join(', ')}`);

  // 权限字典
  const permissionMap = {};
  for (const p of PERMISSIONS) {
    const [perm] = await Permission.findOrCreate({ where: { code: p.code }, defaults: p });
    permissionMap[p.code] = perm;
  }
  logger.info(`权限: 共 ${Object.keys(permissionMap).length} 项`);

  // 角色-权限绑定
  for (const [roleCode, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roleInstances[roleCode];
    if (!role) continue;
    const perms = codes.map((c) => permissionMap[c]).filter(Boolean);
    await role.setPermissions(perms);
    logger.info(`角色 ${roleCode} → ${perms.length} 条权限`);
  }

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const [user, created] = await User.findOrCreate({
      where: { username: u.username },
      defaults: {
        username: u.username,
        password_hash: hash,
        real_name: u.real_name,
        role_id: roleMap[u.roleCode],
        status: 1,
      },
    });
    if (!created) {
      user.password_hash = hash;
      user.role_id = roleMap[u.roleCode];
      user.real_name = u.real_name;
      await user.save();
    }
    logger.info(`用户 ${u.username} / ${u.password} (${created ? '新建' : '已更新'})`);
  }

  // 卡种模板
  const PLANS = [
    { code: 'P-MONTH',   name: '月卡',   type: 'PERIOD', price: 299,  duration_days: 30,  description: '30 天不限次' },
    { code: 'P-QUARTER', name: '季卡',   type: 'PERIOD', price: 799,  duration_days: 90,  description: '90 天不限次' },
    { code: 'P-YEAR',    name: '年卡',   type: 'PERIOD', price: 2399, duration_days: 365, description: '365 天不限次' },
    { code: 'C-10',      name: '10 次卡', type: 'COUNT',  price: 599,  total_count: 10,    description: '有效期一年' },
    { code: 'C-30',      name: '30 次卡', type: 'COUNT',  price: 1499, total_count: 30,    description: '有效期一年' },
    { code: 'S-1000',    name: '储值 1000', type: 'STORED', price: 1000, initial_balance: 1100, description: '赠送 100 元' },
  ];
  for (const p of PLANS) {
    const [, c] = await MembershipPlan.findOrCreate({ where: { code: p.code }, defaults: p });
    if (c) logger.info(`卡种 ${p.code} 已创建`);
  }

  // 教练
  const coachCnt = await Coach.count();
  if (coachCnt === 0) {
    const COACHES = [
      { name: '王铁', gender: 1, phone: '13800001001', specialty: '力量训练,减脂塑形', intro: '8 年执教经验，擅长 HIIT 与私教', hire_date: '2022-06-01' },
      { name: '李姗', gender: 2, phone: '13800001002', specialty: '瑜伽,普拉提', intro: '国际瑜伽联盟 RYT500 认证', hire_date: '2023-03-15' },
      { name: '陈阳', gender: 1, phone: '13800001003', specialty: '搏击,动感单车', intro: '前职业拳击运动员', hire_date: '2024-01-10' },
    ];
    for (const c of COACHES) await Coach.create({ ...c, status: 1 });
    logger.info(`示例教练 ${COACHES.length} 人已创建`);
  }

  // 课程库
  const courseCnt = await Course.count();
  let courseMap = {};
  if (courseCnt === 0) {
    const COURSES = [
      { code: 'G-HIIT',   name: 'HIIT 燃脂',  type: 'GROUP', duration_min: 45, capacity: 15, description: '高强度间歇训练' },
      { code: 'G-YOGA',   name: '流瑜伽',     type: 'GROUP', duration_min: 60, capacity: 12, description: '适合初中级' },
      { code: 'G-SPIN',   name: '动感单车',   type: 'GROUP', duration_min: 45, capacity: 20, description: '音乐节奏单车课' },
      { code: 'P-PT60',   name: '私教 1v1',   type: 'PERSONAL', duration_min: 60, capacity: 1, price: 399, description: '一对一定制课程' },
    ];
    for (const c of COURSES) {
      const [row] = await Course.findOrCreate({ where: { code: c.code }, defaults: { ...c, status: 1 } });
      courseMap[c.code] = row;
    }
    logger.info(`课程 ${COURSES.length} 个已创建`);
  } else {
    const all = await Course.findAll();
    all.forEach((c) => { courseMap[c.code] = c; });
  }

  // 示例排期（未来一周）
  const scheduleCnt = await CourseSchedule.count();
  if (scheduleCnt === 0) {
    const coaches = await Coach.findAll();
    if (coaches.length && courseMap['G-HIIT']) {
      const plan = [
        { courseCode: 'G-HIIT', coachIdx: 0, dayOffset: 1, hour: 19, minute: 0 },
        { courseCode: 'G-YOGA', coachIdx: 1, dayOffset: 1, hour: 20, minute: 0 },
        { courseCode: 'G-SPIN', coachIdx: 2, dayOffset: 2, hour: 19, minute: 0 },
        { courseCode: 'G-HIIT', coachIdx: 0, dayOffset: 3, hour: 19, minute: 0 },
        { courseCode: 'G-YOGA', coachIdx: 1, dayOffset: 4, hour: 10, minute: 0 },
        { courseCode: 'P-PT60', coachIdx: 0, dayOffset: 2, hour: 14, minute: 0 },
      ];
      for (const p of plan) {
        const course = courseMap[p.courseCode];
        const coach = coaches[p.coachIdx % coaches.length];
        const start = dayjs().add(p.dayOffset, 'day').hour(p.hour).minute(p.minute).second(0).millisecond(0);
        const end = start.add(course.duration_min, 'minute');
        await CourseSchedule.create({
          course_id: course.id,
          coach_id: coach.id,
          start_time: start.toDate(),
          end_time: end.toDate(),
          location: course.type === 'PERSONAL' ? '私教区' : '团课室 A',
          capacity: course.capacity || 1,
          booked_count: 0,
          status: 'OPEN',
        });
      }
      logger.info(`示例排期 ${plan.length} 条已创建`);
    }
  }

  // 示例会员
  const memberCnt = await Member.count();
  if (memberCnt === 0) {
    const demos = [
      { name: '李小明', gender: 1, phone: '13800000001', tags: 'VIP,健身新手' },
      { name: '王小红', gender: 2, phone: '13800000002', tags: '减脂' },
      { name: '张伟',   gender: 1, phone: '13800000003', tags: '增肌' },
    ];
    for (const d of demos) {
      await Member.create({ ...d, member_no: genNo('M'), status: 1 });
    }
    logger.info(`示例会员 ${demos.length} 人已创建`);
  }

  // 将 member 用户账号关联到一个会员档案（张三）
  const memberUser = await User.findOne({ where: { username: 'member' } });
  if (memberUser) {
    const alreadyLinked = await Member.findOne({ where: { user_id: memberUser.id } });
    if (!alreadyLinked) {
      // 找到名字是"张三"的会员或任意一个未关联的会员
      let target = await Member.findOne({ where: { name: '张三' } });
      if (!target) target = await Member.findOne({ where: { user_id: null } });
      if (target) {
        await target.update({ user_id: memberUser.id });
        logger.info(`已将会员 ${target.name}(${target.member_no}) 关联到 member 账号`);
      } else {
        const m = await Member.create({ name: '张三', gender: 1, phone: '13800000004', member_no: genNo('M'), status: 1, user_id: memberUser.id });
        logger.info(`已创建会员 ${m.name}(${m.member_no}) 并关联到 member 账号`);
      }
    }
  }

  // 商品
  const prodCnt = await Product.count();
  if (prodCnt === 0) {
    const PRODUCTS = [
      { code: 'PRD-001', name: '蛋白粉（乳清）', category: '营养品', price: 268, cost: 150, stock: 50, stock_alert: 10, unit: '桶' },
      { code: 'PRD-002', name: '运动毛巾',       category: '装备',   price: 39,  cost: 12,  stock: 100, stock_alert: 20, unit: '条' },
      { code: 'PRD-003', name: '摇摇杯',         category: '装备',   price: 49,  cost: 15,  stock: 80,  stock_alert: 15, unit: '个' },
      { code: 'PRD-004', name: '矿泉水 550ml',   category: '饮品',   price: 3,   cost: 1,   stock: 200, stock_alert: 30, unit: '瓶' },
      { code: 'PRD-005', name: '能量棒',         category: '营养品', price: 15,  cost: 6,   stock: 120, stock_alert: 20, unit: '根' },
    ];
    for (const p of PRODUCTS) await Product.create({ ...p, status: 1 });
    logger.info(`商品 ${PRODUCTS.length} 个已创建`);
  }

  logger.info('种子数据写入完成 ✔');
  await sequelize.close();
}

run().catch(async (err) => {
  logger.error(err);
  try { await sequelize.close(); } catch { /* noop */ }
  process.exit(1);
});
