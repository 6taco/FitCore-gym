import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import request from 'supertest';
import app from '../src/app.js';
import { sequelize } from '../src/models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../uploads');
const api = request(app);
const runId = `${Date.now()}`;
const suffix = runId.slice(-6);
const createdFiles = [];
const skips = [];
let phoneSeq = Number(suffix);

function nextPhone() {
  phoneSeq += 1;
  return `139${String(phoneSeq).padStart(8, '0').slice(-8)}`;
}

function logStep(title) {
  console.log(`\n[full-check] ${title}`);
}

function pickData(res, expectedStatus = 200) {
  assert.equal(res.status, expectedStatus, `${res.req.method} ${res.req.path} -> ${res.status} ${res.text || ''}`);
  assert.equal(res.body.code, 0, `${res.req.method} ${res.req.path} code=${res.body.code} message=${res.body.message}`);
  return res.body.data;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function bufferParser(res, callback) {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}

async function login(username, password) {
  const res = await api.post('/api/auth/login').send({ username, password });
  return pickData(res);
}

async function getJson(method, url, token, query) {
  let req = api[method](url).set(auth(token));
  if (query) req = req.query(query);
  const res = await req;
  return pickData(res);
}

async function sendJson(method, url, token, body, expectedStatus = 200) {
  let req = api[method](url);
  if (token) req = req.set(auth(token));
  const res = await req.send(body);
  return pickData(res, expectedStatus);
}

async function uploadFile(token, filename, buffer, field = 'file') {
  const res = await api.post('/api/upload').set(auth(token)).attach(field, buffer, filename);
  return pickData(res);
}

async function importExcel(token, buffer) {
  const res = await api.post('/api/import/members').set(auth(token)).attach('file', buffer, 'members.xlsx');
  return pickData(res);
}

async function exportBinary(url, token) {
  const res = await api.get(url).set(auth(token)).buffer(true).parse(bufferParser);
  assert.equal(res.status, 200, `${url} -> ${res.status}`);
  assert.match(String(res.headers['content-type'] || ''), /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/i);
  assert.ok(res.body && res.body.length > 0, `${url} 导出文件为空`);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  logStep('检查数据库连接');
  await sequelize.authenticate();

  logStep('管理员登录与认证链路');
  let adminAuth;
  try {
    adminAuth = await login('admin', 'admin123');
  } catch (error) {
    throw new Error('管理员登录失败。请先确认数据库已初始化并执行过 db:seed，且 admin/admin123 可用。');
  }
  const adminToken = adminAuth.token;
  const adminRefreshToken = adminAuth.refreshToken;
  assert.ok(adminToken);
  assert.ok(adminRefreshToken);

  const adminProfile = await getJson('get', '/api/auth/profile', adminToken);
  assert.equal(adminProfile.username, 'admin');

  const refreshed = await sendJson('post', '/api/auth/refresh', null, { refreshToken: adminRefreshToken });
  assert.ok(refreshed.token);
  assert.ok(refreshed.refreshToken);

  const roles = await getJson('get', '/api/system/roles', adminToken);
  const permissions = await getJson('get', '/api/system/permissions', adminToken);
  assert.ok(Array.isArray(roles) && roles.length > 0);
  assert.ok(Array.isArray(permissions) && permissions.length > 0);

  const memberRole = roles.find((item) => item.code === 'member');
  assert.ok(memberRole, '缺少内置 member 角色，请先执行种子数据');

  logStep('角色、用户、修改密码与重置密码');
  const roleData = await sendJson('post', '/api/system/roles', adminToken, {
    code: `fc_role_${suffix}`,
    name: `巡检角色${suffix}`,
    description: 'full-check role',
    permissionIds: permissions.slice(0, 2).map((item) => item.id),
  });
  const checkRoleId = roleData.id;
  assert.ok(checkRoleId);

  await sendJson('put', `/api/system/roles/${checkRoleId}`, adminToken, {
    name: `巡检角色已更新${suffix}`,
    description: 'full-check role updated',
    permissionIds: permissions.slice(0, 3).map((item) => item.id),
  });

  const sysUserUsername = `fcsys${suffix}`;
  const sysUserData = await sendJson('post', '/api/system/users', adminToken, {
    username: sysUserUsername,
    password: 'Init1234',
    real_name: `巡检系统用户${suffix}`,
    phone: nextPhone(),
    role_id: checkRoleId,
  });
  const sysUserId = sysUserData.id;
  assert.ok(sysUserId);

  const usersPage = await getJson('get', '/api/system/users', adminToken, { keyword: sysUserUsername });
  assert.ok(Array.isArray(usersPage.list));
  assert.ok(usersPage.list.some((item) => item.id === sysUserId));

  let sysUserAuth = await login(sysUserUsername, 'Init1234');
  assert.ok(sysUserAuth.token);

  await sendJson('post', '/api/auth/change-password', sysUserAuth.token, {
    oldPassword: 'Init1234',
    newPassword: 'Changed1234',
  });

  sysUserAuth = await login(sysUserUsername, 'Changed1234');
  assert.ok(sysUserAuth.token);

  await sendJson('post', `/api/system/users/${sysUserId}/reset-password`, adminToken, { password: 'Reset1234' });
  sysUserAuth = await login(sysUserUsername, 'Reset1234');
  assert.ok(sysUserAuth.token);

  await sendJson('put', `/api/system/users/${sysUserId}`, adminToken, {
    real_name: `巡检系统用户更新${suffix}`,
    status: 1,
  });

  logStep('会员、体测、可关联账号与统计');
  const memberAuthUsername = `fcmem${suffix}`;
  const memberUserData = await sendJson('post', '/api/system/users', adminToken, {
    username: memberAuthUsername,
    password: 'Member1234',
    real_name: `巡检会员账号${suffix}`,
    phone: nextPhone(),
    role_id: memberRole.id,
  });
  const memberUserId = memberUserData.id;

  const linkableUsers = await getJson('get', '/api/members/linkable-users', adminToken);
  assert.ok(Array.isArray(linkableUsers));
  assert.ok(linkableUsers.some((item) => item.id === memberUserId));

  const memberA = await sendJson('post', '/api/members', adminToken, {
    name: `巡检会员A${suffix}`,
    gender: 1,
    phone: nextPhone(),
    tags: 'full-check,A',
  });
  const memberB = await sendJson('post', '/api/members', adminToken, {
    name: `巡检会员B${suffix}`,
    gender: 2,
    phone: nextPhone(),
    tags: 'full-check,B',
  });
  const memberSelf = await sendJson('post', '/api/members', adminToken, {
    name: `巡检自助会员${suffix}`,
    gender: 1,
    phone: nextPhone(),
    tags: 'full-check,self',
    user_id: memberUserId,
  });

  const memberAId = memberA.id;
  const memberBId = memberB.id;
  const memberSelfId = memberSelf.id;
  assert.ok(memberAId && memberBId && memberSelfId);

  const memberList = await getJson('get', '/api/members', adminToken, { keyword: suffix, pageSize: 50 });
  assert.ok(memberList.list.length >= 3);

  const memberDetail = await getJson('get', `/api/members/${memberAId}`, adminToken);
  assert.equal(memberDetail.id, memberAId);

  await sendJson('put', `/api/members/${memberAId}`, adminToken, {
    tags: 'full-check,A,updated',
    remark: 'updated by full-check',
  });

  const measurement = await sendJson('post', `/api/members/${memberAId}/measurements`, adminToken, {
    measured_at: dayjs().toISOString(),
    height_cm: 180,
    weight_kg: 75,
    body_fat: 18.5,
    remark: 'full-check',
  });
  const measurementId = measurement.id;
  assert.ok(measurementId);

  const measurements = await getJson('get', `/api/members/${memberAId}/measurements`, adminToken);
  assert.ok(Array.isArray(measurements) && measurements.some((item) => item.id === measurementId));

  await sendJson('delete', `/api/members/${memberAId}/measurements/${measurementId}`, adminToken);

  const memberStats = await getJson('get', '/api/members/stats', adminToken);
  assert.ok(typeof memberStats.total === 'number');

  logStep('卡种 CRUD 与运营卡种创建');
  const crudPlan = await sendJson('post', '/api/plans', adminToken, {
    code: `FC-PLAN-DEL-${suffix}`,
    name: `巡检删除卡${suffix}`,
    type: 'PERIOD',
    price: 99,
    duration_days: 7,
    description: 'full-check deletable plan',
  });
  const crudPlanId = crudPlan.id;
  assert.ok(crudPlanId);

  await sendJson('put', `/api/plans/${crudPlanId}`, adminToken, { name: `巡检删除卡更新${suffix}` });
  await sendJson('delete', `/api/plans/${crudPlanId}`, adminToken);

  const periodPlan = await sendJson('post', '/api/plans', adminToken, {
    code: `FC-PER-${suffix}`,
    name: `巡检月卡${suffix}`,
    type: 'PERIOD',
    price: 199,
    duration_days: 30,
    description: 'full-check period',
  });
  const countPlan = await sendJson('post', '/api/plans', adminToken, {
    code: `FC-CNT-${suffix}`,
    name: `巡检次卡${suffix}`,
    type: 'COUNT',
    price: 299,
    total_count: 10,
    description: 'full-check count',
  });
  const storedPlan = await sendJson('post', '/api/plans', adminToken, {
    code: `FC-STO-${suffix}`,
    name: `巡检储值卡${suffix}`,
    type: 'STORED',
    price: 500,
    initial_balance: 600,
    description: 'full-check stored',
  });

  const plans = await getJson('get', '/api/plans', adminToken);
  assert.ok(Array.isArray(plans) && plans.some((item) => item.id === periodPlan.id));

  logStep('办卡、续费、挂起、恢复、批量续费、转让、作废、储值历史');
  const memberAPeriodCard = await sendJson('post', '/api/memberships/issue', adminToken, {
    member_id: memberAId,
    plan_id: periodPlan.id,
  });
  const memberBPeriodCard = await sendJson('post', '/api/memberships/issue', adminToken, {
    member_id: memberBId,
    plan_id: periodPlan.id,
  });
  const memberSelfPeriodCard = await sendJson('post', '/api/memberships/issue', adminToken, {
    member_id: memberSelfId,
    plan_id: periodPlan.id,
  });
  const memberACountCard = await sendJson('post', '/api/memberships/issue', adminToken, {
    member_id: memberAId,
    plan_id: countPlan.id,
  });
  const transferCountCard = await sendJson('post', '/api/memberships/issue', adminToken, {
    member_id: memberAId,
    plan_id: countPlan.id,
  });
  const memberAStoredCard = await sendJson('post', '/api/memberships/issue', adminToken, {
    member_id: memberAId,
    plan_id: storedPlan.id,
  });

  assert.ok(memberAPeriodCard.id && memberBPeriodCard.id && memberSelfPeriodCard.id);
  assert.ok(memberACountCard.id && transferCountCard.id && memberAStoredCard.id);

  const membershipsA = await getJson('get', `/api/members/${memberAId}/memberships`, adminToken);
  assert.ok(Array.isArray(membershipsA) && membershipsA.length >= 3);

  await sendJson('post', `/api/memberships/${memberAPeriodCard.id}/renew`, adminToken, { days: 15 });
  await sendJson('post', `/api/memberships/${memberAPeriodCard.id}/suspend`, adminToken);
  await sendJson('post', `/api/memberships/${memberAPeriodCard.id}/resume`, adminToken);

  const batchRenew = await sendJson('post', '/api/memberships/batch-renew', adminToken, {
    ids: [memberAPeriodCard.id, memberBPeriodCard.id, memberSelfPeriodCard.id],
    days: 7,
  });
  assert.equal(batchRenew.success, 3);

  await sendJson('post', `/api/memberships/${transferCountCard.id}/transfer`, adminToken, { target_member_id: memberBId });
  await sendJson('post', `/api/memberships/${transferCountCard.id}/cancel`, adminToken);

  const expiring = await getJson('get', '/api/memberships/expiring', adminToken, { days: 365 });
  assert.ok(Array.isArray(expiring));

  logStep('手动签到、扫码签到、自助签到状态');
  const manualCheckIn = await sendJson('post', '/api/check-ins', adminToken, {
    member_id: memberBId,
    method: 'MANUAL',
    remark: 'full-check manual',
  });
  assert.ok(manualCheckIn.id);

  const checkIns = await getJson('get', '/api/check-ins', adminToken, { member_id: memberBId });
  assert.ok(Array.isArray(checkIns.list) && checkIns.list.some((item) => item.id === manualCheckIn.id));

  const todayStats = await getJson('get', '/api/check-ins/today', adminToken);
  assert.ok(todayStats.today >= 1);

  const memberUserAuth = await login(memberAuthUsername, 'Member1234');
  const qrTokenData = await getJson('get', '/api/check-ins/qr-token', adminToken);
  assert.ok(qrTokenData.token);

  const qrCheckIn = await sendJson('post', `/api/check-ins/qr/${qrTokenData.token}`, memberUserAuth.token, {});
  assert.ok(qrCheckIn.id);

  const qrStatus = await getJson('get', `/api/check-ins/qr/${qrTokenData.token}/status`, adminToken);
  assert.equal(qrStatus.status, 'SUCCESS');

  logStep('教练、课程、排期 CRUD');
  const coachCrud = await sendJson('post', '/api/coaches', adminToken, {
    name: `巡检删除教练${suffix}`,
    gender: 1,
    phone: nextPhone(),
    specialty: 'full-check',
    intro: 'delete me',
  });
  await sendJson('put', `/api/coaches/${coachCrud.id}`, adminToken, { intro: 'updated' });
  await sendJson('delete', `/api/coaches/${coachCrud.id}`, adminToken);

  const coachOp = await sendJson('post', '/api/coaches', adminToken, {
    name: `巡检运营教练${suffix}`,
    gender: 1,
    phone: nextPhone(),
    specialty: 'full-check-op',
    intro: 'op coach',
  });
  const coachOpId = coachOp.id;

  const courseCrud = await sendJson('post', '/api/courses', adminToken, {
    code: `FC-DEL-COURSE-${suffix}`,
    name: `巡检删除课程${suffix}`,
    type: 'GROUP',
    duration_min: 45,
    capacity: 10,
    description: 'delete me',
  });
  await sendJson('put', `/api/courses/${courseCrud.id}`, adminToken, { description: 'updated' });
  await sendJson('delete', `/api/courses/${courseCrud.id}`, adminToken);

  const groupCourse = await sendJson('post', '/api/courses', adminToken, {
    code: `FC-GRP-${suffix}`,
    name: `巡检团课${suffix}`,
    type: 'GROUP',
    duration_min: 50,
    capacity: 12,
    description: 'group course',
  });
  const personalCourse = await sendJson('post', '/api/courses', adminToken, {
    code: `FC-PT-${suffix}`,
    name: `巡检私教${suffix}`,
    type: 'PERSONAL',
    duration_min: 60,
    price: 380,
    description: 'personal course',
  });

  const coachList = await getJson('get', '/api/coaches', adminToken, { keyword: suffix, pageSize: 50 });
  assert.ok(coachList.list.some((item) => item.id === coachOpId));
  const coachDetail = await getJson('get', `/api/coaches/${coachOpId}`, adminToken);
  assert.equal(coachDetail.id, coachOpId);

  const courses = await getJson('get', '/api/courses', adminToken, { keyword: suffix });
  assert.ok(Array.isArray(courses) && courses.some((item) => item.id === groupCourse.id));

  const baseDay = dayjs().add(2, 'day').second(0).millisecond(0);
  const scheduleCrud = await sendJson('post', '/api/schedules', adminToken, {
    course_id: groupCourse.id,
    coach_id: coachOpId,
    start_time: baseDay.hour(9).minute(0).toISOString(),
    location: 'A1',
    capacity: 10,
  });
  const scheduleCrudId = scheduleCrud.id;
  assert.ok(scheduleCrudId);

  const scheduleCrudDetail = await getJson('get', `/api/schedules/${scheduleCrudId}`, adminToken);
  assert.equal(scheduleCrudDetail.id, scheduleCrudId);

  await sendJson('put', `/api/schedules/${scheduleCrudId}`, adminToken, {
    location: 'A2',
    capacity: 11,
  });
  await sendJson('delete', `/api/schedules/${scheduleCrudId}`, adminToken);

  const scheduleBook = await sendJson('post', '/api/schedules', adminToken, {
    course_id: groupCourse.id,
    coach_id: coachOpId,
    start_time: baseDay.hour(11).minute(0).toISOString(),
    location: 'B1',
    capacity: 10,
  });
  const scheduleSelf = await sendJson('post', '/api/schedules', adminToken, {
    course_id: groupCourse.id,
    coach_id: coachOpId,
    start_time: baseDay.hour(13).minute(0).toISOString(),
    location: 'B2',
    capacity: 10,
  });
  const scheduleCheckIn = await sendJson('post', '/api/schedules', adminToken, {
    course_id: groupCourse.id,
    coach_id: coachOpId,
    start_time: baseDay.hour(15).minute(0).toISOString(),
    location: 'B3',
    capacity: 10,
  });
  const scheduleNoShow = await sendJson('post', '/api/schedules', adminToken, {
    course_id: groupCourse.id,
    coach_id: coachOpId,
    start_time: baseDay.hour(17).minute(0).toISOString(),
    location: 'B4',
    capacity: 10,
  });
  const scheduleNotify = await sendJson('post', '/api/schedules', adminToken, {
    course_id: groupCourse.id,
    coach_id: coachOpId,
    start_time: baseDay.hour(19).minute(0).toISOString(),
    location: 'B5',
    capacity: 10,
  });

  const scheduleList = await getJson('get', '/api/schedules', adminToken, {
    start: baseDay.startOf('day').toISOString(),
    end: baseDay.endOf('day').toISOString(),
  });
  assert.ok(Array.isArray(scheduleList) && scheduleList.length >= 5);

  const adminBooking = await sendJson('post', '/api/bookings', adminToken, {
    schedule_id: scheduleBook.id,
    member_id: memberAId,
    remark: 'admin booking',
  });
  await sendJson('post', `/api/bookings/${adminBooking.id}/cancel`, adminToken);

  const selfBooking = await sendJson('post', '/api/bookings/self', memberUserAuth.token, {
    schedule_id: scheduleSelf.id,
  });
  assert.ok(selfBooking.id);

  const myBookings = await getJson('get', '/api/bookings/my', memberUserAuth.token, {
    member_id: memberSelfId,
    upcoming: 1,
  });
  assert.ok(Array.isArray(myBookings));
  assert.ok(myBookings.some((item) => item.id === selfBooking.id));

  await sendJson('post', `/api/bookings/${selfBooking.id}/self-cancel`, memberUserAuth.token);

  const checkInBooking = await sendJson('post', '/api/bookings', adminToken, {
    schedule_id: scheduleCheckIn.id,
    member_id: memberAId,
    remark: 'check-in booking',
  });
  await sendJson('post', `/api/bookings/${checkInBooking.id}/check-in`, adminToken);

  const review = await sendJson('post', '/api/reviews', adminToken, {
    schedule_id: scheduleCheckIn.id,
    member_id: memberAId,
    rating: 5,
    content: 'full-check review',
  });
  assert.ok(review.id);

  const reviews = await getJson('get', '/api/reviews', adminToken, { schedule_id: scheduleCheckIn.id });
  assert.ok(Array.isArray(reviews.list) && reviews.list.some((item) => item.id === review.id));
  await sendJson('delete', `/api/reviews/${review.id}`, adminToken);

  const noShowBooking = await sendJson('post', '/api/bookings', adminToken, {
    schedule_id: scheduleNoShow.id,
    member_id: memberBId,
    remark: 'no-show booking',
  });
  await sendJson('post', `/api/bookings/${noShowBooking.id}/no-show`, adminToken);

  const notifyBooking = await sendJson('post', '/api/bookings', adminToken, {
    schedule_id: scheduleNotify.id,
    member_id: memberSelfId,
    remark: 'notify booking',
  });
  assert.ok(notifyBooking.id);
  await sendJson('post', `/api/schedules/${scheduleNotify.id}/cancel`, adminToken);

  const coachStats = await getJson('get', `/api/coaches/${coachOpId}/stats`, adminToken);
  assert.equal(coachStats.coach_id, coachOpId);
  const ranking = await getJson('get', '/api/coaches/ranking', adminToken);
  assert.ok(Array.isArray(ranking));

  logStep('通知中心');
  const unreadBefore = await getJson('get', '/api/notifications/unread-count', memberUserAuth.token);
  assert.ok(unreadBefore.count >= 1);
  const notifications = await getJson('get', '/api/notifications', memberUserAuth.token, { pageSize: 20 });
  assert.ok(Array.isArray(notifications.list) && notifications.list.length >= 1);
  const unreadIds = notifications.list.filter((item) => item.is_read === 0).map((item) => item.id);
  if (unreadIds.length > 0) {
    await sendJson('post', '/api/notifications/read', memberUserAuth.token, { ids: unreadIds.slice(0, 1) });
  }
  await sendJson('post', '/api/notifications/read-all', memberUserAuth.token, {});
  const unreadAfter = await getJson('get', '/api/notifications/unread-count', memberUserAuth.token);
  assert.equal(unreadAfter.count, 0);

  logStep('商品、库存、上传');
  const productCrud = await sendJson('post', '/api/products', adminToken, {
    code: `FC-PRD-DEL-${suffix}`,
    name: `巡检删除商品${suffix}`,
    category: 'full-check',
    price: 18,
    cost: 8,
    stock: 10,
    stock_alert: 2,
    unit: '件',
  });
  await sendJson('put', `/api/products/${productCrud.id}`, adminToken, { name: `巡检删除商品更新${suffix}` });
  await sendJson('delete', `/api/products/${productCrud.id}`, adminToken);

  const productOp = await sendJson('post', '/api/products', adminToken, {
    code: `FC-PRD-OP-${suffix}`,
    name: `巡检运营商品${suffix}`,
    category: 'full-check',
    price: 18,
    cost: 8,
    stock: 20,
    stock_alert: 3,
    unit: '件',
  });
  const productOpId = productOp.id;

  const products = await getJson('get', '/api/products', adminToken, { keyword: suffix, pageSize: 50 });
  assert.ok(Array.isArray(products.list) && products.list.some((item) => item.id === productOpId));

  await sendJson('put', `/api/products/${productOpId}`, adminToken, { price: 18, name: `巡检运营商品更新${suffix}` });
  await sendJson('post', `/api/products/${productOpId}/stock`, adminToken, { type: 'IN', quantity: 5, reason: 'full-check in' });
  await sendJson('post', `/api/products/${productOpId}/stock`, adminToken, { type: 'OUT', quantity: 3, reason: 'full-check out' });
  await sendJson('post', `/api/products/${productOpId}/stock`, adminToken, { type: 'ADJUST', quantity: 25, reason: 'full-check adjust' });
  const movements = await getJson('get', `/api/products/${productOpId}/movements`, adminToken);
  assert.ok(Array.isArray(movements) && movements.length >= 3);

  const fakePng = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const uploadRes = await uploadFile(adminToken, `full-check-${suffix}.png`, fakePng);
  assert.ok(uploadRes.filename);
  createdFiles.push(path.resolve(uploadDir, uploadRes.filename));

  logStep('订单、收银、退款、储值流水、报表、看板');
  const storedCheckout = await sendJson('post', '/api/orders/checkout', adminToken, {
    member_id: memberAId,
    items: [
      { item_type: 'PRODUCT', item_id: productOpId, quantity: 1 },
    ],
    payments: [
      { method: 'STORED', amount: 18 },
    ],
    remark: 'full-check stored checkout',
  });
  const storedOrderId = storedCheckout.id;
  assert.ok(storedOrderId);

  const storedHistory = await getJson('get', `/api/memberships/${memberAStoredCard.id}/stored-history`, adminToken);
  assert.ok(Array.isArray(storedHistory.list));
  assert.ok(storedHistory.list.some((item) => item.order_no === storedCheckout.order_no));

  await sendJson('post', `/api/orders/${storedOrderId}/refund`, adminToken);

  const pendingOrder = await sendJson('post', '/api/orders/create-pending', adminToken, {
    member_id: memberBId,
    items: [
      { item_type: 'MEMBERSHIP', item_id: periodPlan.id, quantity: 1 },
    ],
    payments: [
      { method: 'WECHAT', amount: 199 },
    ],
    remark: 'full-check pending order',
  });
  const pendingOrderId = pendingOrder.id;
  assert.ok(pendingOrderId);

  const pendingStatus = await getJson('get', `/api/orders/${pendingOrderId}/status`, adminToken);
  assert.equal(pendingStatus.status, 'PENDING');

  const confirmPay = await sendJson('post', `/api/orders/${pendingOrderId}/confirm-pay`, adminToken, {});
  assert.equal(confirmPay.id, pendingOrderId);

  const paidStatus = await getJson('get', `/api/orders/${pendingOrderId}/status`, adminToken);
  assert.equal(paidStatus.status, 'PAID');

  const orders = await getJson('get', '/api/orders', adminToken, { pageSize: 50, keyword: pendingOrder.order_no });
  assert.ok(Array.isArray(orders.list) && orders.list.some((item) => item.id === pendingOrderId));

  const orderDetail = await getJson('get', `/api/orders/${pendingOrderId}`, adminToken);
  assert.equal(orderDetail.id, pendingOrderId);

  const dailyReport = await getJson('get', '/api/reports/daily', adminToken);
  assert.ok(typeof dailyReport === 'object');
  const monthlyReport = await getJson('get', '/api/reports/monthly', adminToken);
  assert.ok(typeof monthlyReport === 'object');
  const monthRevenue = await getJson('get', '/api/reports/month-revenue', adminToken);
  assert.ok(typeof monthRevenue.revenue === 'number');

  const revenueTrend = await getJson('get', '/api/dashboard/revenue-trend', adminToken);
  assert.ok(Array.isArray(revenueTrend));
  const hotCourses = await getJson('get', '/api/dashboard/hot-courses', adminToken);
  assert.ok(Array.isArray(hotCourses));
  const stockAlerts = await getJson('get', '/api/dashboard/stock-alerts', adminToken);
  assert.ok(Array.isArray(stockAlerts));
  const memberGrowth = await getJson('get', '/api/dashboard/member-growth', adminToken);
  assert.ok(Array.isArray(memberGrowth));

  logStep('导入、导出');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('会员导入');
  sheet.addRow(['姓名', '性别', '手机号', '生日', '标签']);
  sheet.addRow([`导入会员${suffix}`, '男', nextPhone(), '1999-01-01', 'full-check,import']);
  const importBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const importResult = await importExcel(adminToken, importBuffer);
  assert.ok(importResult.success >= 1);

  await exportBinary('/api/export/members', adminToken);
  await exportBinary('/api/export/orders', adminToken);
  await exportBinary('/api/export/products', adminToken);

  logStep('系统设置、操作日志、外部能力说明');
  const settings = await getJson('get', '/api/system/settings', adminToken);
  const settingEntries = Object.values(settings).flatMap((items) => items);
  if (settingEntries.length > 0) {
    const first = settingEntries[0];
    await sendJson('put', '/api/system/settings', adminToken, { [first.key]: first.value });
  } else {
    skips.push('系统设置表为空，已跳过设置更新断言');
  }

  await wait(200);
  const auditLogs = await getJson('get', '/api/system/audit-logs', adminToken, { pageSize: 20 });
  assert.ok(Array.isArray(auditLogs.list));

  skips.push('微信 OAuth / 微信扫码签到依赖外部公众号配置与微信接口，默认未纳入本地 full-check');
  skips.push('full-check 会创建带时间后缀的巡检数据；出于外键关系考虑，仅对部分系统账号/角色做最佳努力清理');

  logStep('清理可回收的系统账号与角色');
  try {
    await sendJson('delete', `/api/system/users/${sysUserId}`, adminToken);
  } catch {
    skips.push(`系统巡检账号 ${sysUserUsername} 未能自动删除，请按需手动清理`);
  }
  try {
    await sendJson('delete', `/api/system/roles/${checkRoleId}`, adminToken);
  } catch {
    skips.push(`巡检角色 fc_role_${suffix} 未能自动删除，请按需手动清理`);
  }

  console.log('\n[full-check] ✅ 巡检完成');
  if (skips.length) {
    console.log('[full-check] 跳过项:');
    for (const item of skips) console.log(`- ${item}`);
  }
}

main()
  .catch((error) => {
    console.error('\n[full-check] ❌ 巡检失败');
    console.error(error?.stack || error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const file of createdFiles) {
      try {
        await fs.unlink(file);
      } catch {
      }
    }
    try {
      await sequelize.close();
    } catch {
    }
  });
