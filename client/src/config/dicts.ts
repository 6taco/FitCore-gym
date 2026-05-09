export const GENDER_OPTIONS = [
  { value: 0, label: '未知' },
  { value: 1, label: '男' },
  { value: 2, label: '女' },
];

export const genderLabel = (v?: number) =>
  GENDER_OPTIONS.find((o) => o.value === v)?.label || '-';

export const PLAN_TYPE_OPTIONS = [
  { value: 'PERIOD', label: '期限卡' },
  { value: 'COUNT', label: '次卡' },
  { value: 'STORED', label: '储值卡' },
];

export const planTypeLabel = (v?: string) =>
  PLAN_TYPE_OPTIONS.find((o) => o.value === v)?.label || v || '-';

export const CARD_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: '有效',   color: 'green' },
  SUSPENDED: { label: '挂起',   color: 'orange' },
  EXPIRED:   { label: '已过期', color: 'default' },
  CANCELLED: { label: '已作废', color: 'red' },
};

export const COURSE_TYPE_OPTIONS = [
  { value: 'GROUP', label: '团课' },
  { value: 'PERSONAL', label: '私教' },
];

export const courseTypeLabel = (v?: string) =>
  COURSE_TYPE_OPTIONS.find((o) => o.value === v)?.label || v || '-';

export const SCHEDULE_STATUS: Record<string, { label: string; color: string }> = {
  OPEN:      { label: '可预约', color: 'green' },
  CLOSED:    { label: '已结束', color: 'default' },
  CANCELLED: { label: '已取消', color: 'red' },
};

export const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  BOOKED:     { label: '已预约',   color: 'blue' },
  CHECKED_IN: { label: '已签到',   color: 'green' },
  CANCELLED:  { label: '已取消',   color: 'default' },
  NO_SHOW:    { label: '未到',     color: 'red' },
};

// Pause 5
export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: '待支付', color: 'orange' },
  PAID:      { label: '已支付', color: 'green' },
  REFUNDED:  { label: '已退款', color: 'red' },
  CANCELLED: { label: '已取消', color: 'default' },
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH',    label: '现金' },
  { value: 'WECHAT',  label: '微信' },
  { value: 'ALIPAY',  label: '支付宝' },
  { value: 'CARD',    label: '银行卡' },
  { value: 'STORED',  label: '储值卡' },
];

export const paymentMethodLabel = (v?: string) =>
  PAYMENT_METHOD_OPTIONS.find((o) => o.value === v)?.label || v || '-';

export const STOCK_MOVE_TYPE: Record<string, { label: string; color: string }> = {
  IN:     { label: '入库', color: 'green' },
  OUT:    { label: '出库', color: 'orange' },
  ADJUST: { label: '盘点', color: 'blue' },
};

export const ITEM_TYPE_OPTIONS = [
  { value: 'PRODUCT',    label: '商品' },
  { value: 'MEMBERSHIP', label: '会籍' },
  { value: 'PERSONAL',   label: '私教' },
];
