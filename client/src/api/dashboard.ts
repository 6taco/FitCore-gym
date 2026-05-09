import request from './request';

export interface RevenueTrendItem { date: string; revenue: number; }
export interface HotCourseItem { name: string; type: string; count: number; }
export interface StockAlertItem { id: number; code: string; name: string; stock: number; stock_alert: number; unit: string; }
export interface MemberGrowthItem { month: string; count: number; }

export const apiRevenueTrend = (): Promise<RevenueTrendItem[]> =>
  request.get('/dashboard/revenue-trend');

export const apiHotCourses = (): Promise<HotCourseItem[]> =>
  request.get('/dashboard/hot-courses');

export const apiStockAlerts = (): Promise<StockAlertItem[]> =>
  request.get('/dashboard/stock-alerts');

export const apiMemberGrowth = (): Promise<MemberGrowthItem[]> =>
  request.get('/dashboard/member-growth');
