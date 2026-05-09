import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { audit } from '../middleware/audit.js';
import {
  listUsers, createUser, updateUser, deleteUser, resetPassword,
} from '../controllers/userController.js';
import {
  listRoles, createRole, updateRole, deleteRole, listPermissions,
} from '../controllers/roleController.js';
import { listAuditLogs } from '../controllers/auditController.js';
import { listSettings, updateSettings } from '../controllers/settingController.js';

const router = Router();

router.use(authRequired);

// 用户
router.get('/users', requirePermission('system:user:view'), listUsers);
router.post('/users', requirePermission('system:user:create'), audit('system', 'user:create'), createUser);
router.put('/users/:id', requirePermission('system:user:update'), audit('system', 'user:update'), updateUser);
router.delete('/users/:id', requirePermission('system:user:delete'), audit('system', 'user:delete'), deleteUser);
router.post('/users/:id/reset-password', requirePermission('system:user:reset'), audit('system', 'user:reset'), resetPassword);

// 角色
router.get('/roles', requirePermission('system:role:view'), listRoles);
router.post('/roles', requirePermission('system:role:manage'), audit('system', 'role:create'), createRole);
router.put('/roles/:id', requirePermission('system:role:manage'), audit('system', 'role:update'), updateRole);
router.delete('/roles/:id', requirePermission('system:role:manage'), audit('system', 'role:delete'), deleteRole);

// 权限字典
router.get('/permissions', requirePermission('system:role:view'), listPermissions);

// 操作日志
router.get('/audit-logs', requirePermission('system:audit:view'), listAuditLogs);

// 系统设置
router.get('/settings', listSettings);
router.put('/settings', requirePermission('system:role:manage'), audit('system', 'settings:update'), updateSettings);

export default router;
