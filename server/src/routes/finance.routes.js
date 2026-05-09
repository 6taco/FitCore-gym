import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { audit } from '../middleware/audit.js';
import {
  listProducts, createProduct, updateProduct, deleteProduct,
  stockChange, stockMovements,
} from '../controllers/productController.js';
import {
  checkout, listOrders, getOrder, refundOrder,
  createPendingOrder, confirmPayment, orderStatus,
} from '../controllers/orderController.js';
import {
  dailySummary, monthlySummary, monthRevenue,
} from '../controllers/reportController.js';

const router = Router();

// ---- 商品 ----
router.get('/products', authRequired, requirePermission('product:view'), listProducts);
router.post('/products', authRequired, requirePermission('product:manage'), audit('product', 'create'), createProduct);
router.put('/products/:id', authRequired, requirePermission('product:manage'), audit('product', 'update'), updateProduct);
router.delete('/products/:id', authRequired, requirePermission('product:manage'), audit('product', 'delete'), deleteProduct);
router.post('/products/:id/stock', authRequired, requirePermission('product:manage'), audit('product', 'stock-change'), stockChange);
router.get('/products/:id/movements', authRequired, requirePermission('product:view'), stockMovements);

// ---- 收银与订单 ----
router.post('/orders/checkout', authRequired, requirePermission('order:manage'), audit('order', 'checkout'), checkout);
router.post('/orders/create-pending', authRequired, requirePermission('order:manage'), audit('order', 'create-pending'), createPendingOrder);
router.get('/orders/:id/status', orderStatus);
router.post('/orders/:id/confirm-pay', confirmPayment);
router.get('/orders', authRequired, requirePermission('order:view'), listOrders);
router.get('/orders/:id', authRequired, requirePermission('order:view'), getOrder);
router.post('/orders/:id/refund', authRequired, requirePermission('order:manage'), audit('order', 'refund'), refundOrder);

// ---- 报表 ----
router.get('/reports/daily', authRequired, requirePermission('report:view'), dailySummary);
router.get('/reports/monthly', authRequired, requirePermission('report:view'), monthlySummary);
router.get('/reports/month-revenue', authRequired, requirePermission('report:view'), monthRevenue);

export default router;
