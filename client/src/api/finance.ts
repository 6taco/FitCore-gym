import request from './request';

// ========== 商品 ==========
export interface ProductItem {
  id: number;
  code: string;
  name: string;
  category?: string;
  price: number;
  cost?: number;
  stock: number;
  stock_alert?: number;
  unit?: string;
  status: number;
  created_at: string;
}

export const apiProductList = (params?: Record<string, any>): Promise<{ list: ProductItem[]; total: number; page: number; pageSize: number }> =>
  request.get('/products', { params });

export const apiProductCreate = (data: Partial<ProductItem>) =>
  request.post('/products', data);

export const apiProductUpdate = (id: number, data: Partial<ProductItem>) =>
  request.put(`/products/${id}`, data);

export const apiProductDelete = (id: number) =>
  request.delete(`/products/${id}`);

export const apiStockChange = (id: number, data: { type: string; quantity: number; reason?: string }) =>
  request.post(`/products/${id}/stock`, data);

export interface StockMovementItem {
  id: number;
  product_id: number;
  type: string;
  quantity: number;
  before_stock: number;
  after_stock: number;
  remark?: string;
  operator?: { id: number; username: string; real_name: string };
  created_at: string;
}

export const apiStockMovements = (id: number): Promise<StockMovementItem[]> =>
  request.get(`/products/${id}/movements`);

// ========== 订单 ==========
export interface OrderListItem {
  id: number;
  order_no: string;
  member?: { id: number; name: string; member_no: string; phone: string };
  operator?: { id: number; username: string; real_name: string };
  total_amount: number;
  paid_amount: number;
  discount: number;
  status: string;
  remark?: string;
  created_at: string;
}

export interface OrderDetail extends OrderListItem {
  items: {
    id: number;
    item_type: string;
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  payments: {
    id: number;
    method: string;
    amount: number;
    trade_no?: string;
    status: string;
    paid_at: string;
  }[];
}

export interface CheckoutPayload {
  member_id?: number | null;
  items: { item_type: string; item_id: number; quantity: number }[];
  payments: { method: string; amount: number; trade_no?: string }[];
  remark?: string;
}

export const apiCheckout = (data: CheckoutPayload) =>
  request.post('/orders/checkout', data);

export const apiOrderList = (params?: Record<string, any>): Promise<{ list: OrderListItem[]; total: number; page: number; pageSize: number }> =>
  request.get('/orders', { params });

export const apiOrderDetail = (id: number): Promise<OrderDetail> =>
  request.get(`/orders/${id}`);

export const apiOrderRefund = (id: number) =>
  request.post(`/orders/${id}/refund`);

export const apiCreatePendingOrder = (data: CheckoutPayload) =>
  request.post('/orders/create-pending', data);

export const apiOrderStatus = (id: number): Promise<{ id: number; order_no: string; status: string; total_amount: number }> =>
  request.get(`/orders/${id}/status`);

export const apiConfirmPayment = (id: number) =>
  request.post(`/orders/${id}/confirm-pay`);

// ========== 报表 ==========
export interface DailySummary {
  date: string;
  totalRevenue: number;
  refundTotal: number;
  netRevenue: number;
  orderCount: number;
  refundCount: number;
  paymentMethods: { method: string; total: number }[];
}

export interface MonthlySummary {
  month: string;
  totalRevenue: number;
  refundTotal: number;
  netRevenue: number;
  orderCount: number;
  dailyTrend: { date: string; revenue: number; count: number }[];
}

export const apiDailySummary = (date?: string): Promise<DailySummary> =>
  request.get('/reports/daily', { params: { date } });

export const apiMonthlySummary = (month?: string): Promise<MonthlySummary> =>
  request.get('/reports/monthly', { params: { month } });

export const apiMonthRevenue = (): Promise<{ revenue: number }> =>
  request.get('/reports/month-revenue');
