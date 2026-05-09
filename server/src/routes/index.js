import { Router } from 'express';
import authRoutes from './auth.routes.js';
import systemRoutes from './system.routes.js';
import memberRoutes from './member.routes.js';
import courseRoutes from './course.routes.js';
import financeRoutes from './finance.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { success } from '../utils/response.js';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { upload, handleUpload } from '../controllers/uploadController.js';
import { listNotifications, unreadCount, markRead, markAllRead } from '../controllers/notificationController.js';
import { exportMembers, exportOrders, exportProducts } from '../controllers/exportController.js';
import { importMembers } from '../controllers/importController.js';
import { getWechatOAuthUrl } from '../controllers/wechatController.js';
import { qrCheckInByWechat, bindWechatAndCheckIn } from '../controllers/checkInController.js';
import multer from 'multer';
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/health', (_req, res) => {
  res.json(success({ status: 'up', timestamp: new Date().toISOString() }));
});

router.post('/upload', authRequired, upload.single('file'), handleUpload);

// 通知
router.get('/notifications', authRequired, listNotifications);
router.get('/notifications/unread-count', authRequired, unreadCount);
router.post('/notifications/read', authRequired, markRead);
router.post('/notifications/read-all', authRequired, markAllRead);

// 导出
router.get('/export/members', authRequired, requirePermission('member:view'), exportMembers);
router.get('/export/orders', authRequired, requirePermission('order:view'), exportOrders);
router.get('/export/products', authRequired, requirePermission('product:view'), exportProducts);

// 导入
router.post('/import/members', authRequired, requirePermission('member:create'), memUpload.single('file'), importMembers);

// 微信扫码签到（公共）
router.get('/wechat/oauth-url', getWechatOAuthUrl);
router.post('/check-ins/qr/:token/wechat', qrCheckInByWechat);
router.post('/check-ins/wechat/bind-and-checkin', bindWechatAndCheckIn);

router.use('/auth', authRoutes);
router.use('/system', systemRoutes);
router.use('/', memberRoutes);
router.use('/', courseRoutes);
router.use('/', financeRoutes);
router.use('/', dashboardRoutes);

export default router;
