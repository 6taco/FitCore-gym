import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  revenueTrend, hotCourses, stockAlerts, memberGrowth,
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/dashboard/revenue-trend', authRequired, requirePermission('report:view'), revenueTrend);
router.get('/dashboard/hot-courses', authRequired, hotCourses);
router.get('/dashboard/stock-alerts', authRequired, requirePermission('product:view'), stockAlerts);
router.get('/dashboard/member-growth', authRequired, requirePermission('member:view'), memberGrowth);

export default router;
