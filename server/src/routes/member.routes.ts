import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { audit } from '../middleware/audit.js';
import {
  listMembers, getMember, createMember, updateMember, deleteMember,
  memberMemberships, listMeasurements, createMeasurement, deleteMeasurement,
  memberStats, linkableUsers,
} from '../controllers/memberController.js';
import {
  listPlans, createPlan, updatePlan, deletePlan,
} from '../controllers/planController.js';
import {
  issueMembership, renewMembership, suspendMembership, resumeMembership,
  transferMembership, cancelMembership, expiringMemberships, storedCardHistory, batchRenew,
} from '../controllers/membershipController.js';
import {
  checkIn, listCheckIns, todayStats, generateQrToken, qrCheckIn, getQrCheckInStatus,
} from '../controllers/checkInController.js';

const router = Router();
router.use(authRequired);

// 会员
router.get('/members/stats', requirePermission('member:view'), memberStats);
router.get('/members/linkable-users', linkableUsers);
router.get('/members', requirePermission('member:view'), listMembers);
router.get('/members/:id', requirePermission('member:view'), getMember);
router.post('/members', requirePermission('member:create'), audit('member', 'create'), createMember);
router.put('/members/:id', requirePermission('member:update'), audit('member', 'update'), updateMember);
router.delete('/members/:id', requirePermission('member:delete'), audit('member', 'delete'), deleteMember);

// 会员会籍
router.get('/members/:id/memberships', requirePermission('membership:view'), memberMemberships);

// 体测
router.get('/members/:id/measurements', requirePermission('member:view'), listMeasurements);
router.post('/members/:id/measurements', requirePermission('member:update'), audit('member', 'measurement:create'), createMeasurement);
router.delete('/members/:id/measurements/:bmId', requirePermission('member:update'), audit('member', 'measurement:delete'), deleteMeasurement);

// 卡种
router.get('/plans', requirePermission('membership:view'), listPlans);
router.post('/plans', requirePermission('membership:manage'), audit('membership', 'plan:create'), createPlan);
router.put('/plans/:id', requirePermission('membership:manage'), audit('membership', 'plan:update'), updatePlan);
router.delete('/plans/:id', requirePermission('membership:manage'), audit('membership', 'plan:delete'), deletePlan);

// 会员卡
router.get('/memberships/expiring', requirePermission('membership:view'), expiringMemberships);
router.post('/memberships/issue', requirePermission('membership:manage'), audit('membership', 'issue'), issueMembership);
router.post('/memberships/:id/renew', requirePermission('membership:manage'), audit('membership', 'renew'), renewMembership);
router.post('/memberships/:id/suspend', requirePermission('membership:manage'), audit('membership', 'suspend'), suspendMembership);
router.post('/memberships/:id/resume', requirePermission('membership:manage'), audit('membership', 'resume'), resumeMembership);
router.post('/memberships/:id/transfer', requirePermission('membership:manage'), audit('membership', 'transfer'), transferMembership);
router.post('/memberships/:id/cancel', requirePermission('membership:manage'), audit('membership', 'cancel'), cancelMembership);
router.get('/memberships/:id/stored-history', requirePermission('membership:view'), storedCardHistory);
router.post('/memberships/batch-renew', requirePermission('membership:manage'), audit('membership', 'batch-renew'), batchRenew);

// 入场签到
router.get('/check-ins/qr-token', requirePermission('checkin:manage'), generateQrToken);
router.get('/check-ins/qr/:token/status', requirePermission('checkin:view'), getQrCheckInStatus);
router.post('/check-ins/qr/:token', qrCheckIn);
router.post('/check-ins', requirePermission('checkin:manage'), audit('check-in', 'create'), checkIn);
router.get('/check-ins', requirePermission('checkin:view'), listCheckIns);
router.get('/check-ins/today', requirePermission('checkin:view'), todayStats);

export default router;
