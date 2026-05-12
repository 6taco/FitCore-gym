import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { apiCache } from '../middleware/cache.js';
import {
  revenueTrend, hotCourses, stockAlerts, memberGrowth,
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/dashboard/revenue-trend', authRequired, requirePermission('report:view'), apiCache(300), revenueTrend);
router.get('/dashboard/hot-courses', authRequired, apiCache(300), hotCourses);
router.get('/dashboard/stock-alerts', authRequired, requirePermission('product:view'), apiCache(300), stockAlerts);
router.get('/dashboard/member-growth', authRequired, requirePermission('member:view'), apiCache(300), memberGrowth);

export default router;
