import request from './request';
import type { PageQuery, PageResult } from './system';

export interface Member {
  id: number;
  member_no: string;
  user_id?: number;
  name: string;
  gender: number;
  birthday?: string;
  phone?: string;
  id_card?: string;
  avatar?: string;
  height_cm?: number;
  weight_kg?: number;
  tags?: string;
  remark?: string;
  status: number;
  active_memberships?: number;
  created_at: string;
  updated_at: string;
}

export interface LinkableUser {
  id: number;
  username: string;
  real_name?: string;
}

export interface BodyMeasurement {
  id: number;
  member_id: number;
  measured_at: string;
  height_cm?: number;
  weight_kg?: number;
  body_fat?: number;
  muscle_kg?: number;
  bmi?: number;
  remark?: string;
  created_at: string;
}

export interface MembershipPlan {
  id: number;
  code: string;
  name: string;
  type: 'PERIOD' | 'COUNT' | 'STORED';
  price: number;
  duration_days?: number;
  total_count?: number;
  initial_balance?: number;
  description?: string;
  status: number;
  created_at: string;
}

export interface MembershipCard {
  id: number;
  member_id: number;
  plan_id: number;
  card_no: string;
  start_date: string;
  end_date?: string;
  remaining_count?: number;
  balance?: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
  plan?: MembershipPlan;
  member?: Member;
  created_at: string;
}

export interface MemberStats {
  total: number;
  active_memberships: number;
  new_this_month: number;
}

// ===== 会员 =====
export const apiMemberList = (p: PageQuery & { status?: number; tag?: string }): Promise<PageResult<Member>> =>
  request.get('/members', { params: p });
export const apiMemberGet = (id: number): Promise<Member> => request.get(`/members/${id}`);
export const apiMemberCreate = (b: any) => request.post('/members', b);
export const apiMemberUpdate = (id: number, b: any) => request.put(`/members/${id}`, b);
export const apiMemberDelete = (id: number) => request.delete(`/members/${id}`);
export const apiLinkableUsers = (currentUserId?: number): Promise<LinkableUser[]> =>
  request.get('/members/linkable-users', { params: currentUserId ? { current_user_id: currentUserId } : {} });
export const apiMemberStats = (): Promise<MemberStats> => request.get('/members/stats');

// ===== 体测 =====
export const apiMeasurementList = (mid: number): Promise<BodyMeasurement[]> =>
  request.get(`/members/${mid}/measurements`);
export const apiMeasurementCreate = (mid: number, b: any) =>
  request.post(`/members/${mid}/measurements`, b);
export const apiMeasurementDelete = (mid: number, id: number) =>
  request.delete(`/members/${mid}/measurements/${id}`);

// ===== 卡种 =====
export const apiPlanList = (params?: { status?: number }): Promise<MembershipPlan[]> =>
  request.get('/plans', { params });
export const apiPlanCreate = (b: any) => request.post('/plans', b);
export const apiPlanUpdate = (id: number, b: any) => request.put(`/plans/${id}`, b);
export const apiPlanDelete = (id: number) => request.delete(`/plans/${id}`);

// ===== 会员卡 =====
export const apiMemberMemberships = (mid: number): Promise<MembershipCard[]> =>
  request.get(`/members/${mid}/memberships`);
export const apiIssue = (b: { member_id: number; plan_id: number; start_date?: string }) =>
  request.post('/memberships/issue', b);
export const apiRenew = (id: number, b: { days?: number; count?: number; amount?: number }) =>
  request.post(`/memberships/${id}/renew`, b);
export const apiSuspend = (id: number) => request.post(`/memberships/${id}/suspend`);
export const apiResume = (id: number) => request.post(`/memberships/${id}/resume`);
export const apiTransfer = (id: number, target_member_id: number) =>
  request.post(`/memberships/${id}/transfer`, { target_member_id });
export const apiCancel = (id: number) => request.post(`/memberships/${id}/cancel`);
export const apiExpiring = (days = 7): Promise<MembershipCard[]> =>
  request.get('/memberships/expiring', { params: { days } });

// ===== 入场签到 =====
export interface CheckInRecord {
  id: number;
  member_id: number;
  check_in_at: string;
  method: string;
  remark?: string;
  member?: { id: number; name: string; member_no: string; phone?: string };
  operator?: { id: number; username: string; real_name: string };
}

export const apiCheckIn = (b: { member_id: number; method?: string; remark?: string }) =>
  request.post('/check-ins', b);
export const apiCheckInList = (params?: Record<string, any>): Promise<{ list: CheckInRecord[]; total: number; page: number; pageSize: number }> =>
  request.get('/check-ins', { params });
export const apiCheckInToday = (): Promise<{ today: number }> =>
  request.get('/check-ins/today');

export const apiCheckInQrToken = (): Promise<{ token: string; expires_in: number }> =>
  request.get('/check-ins/qr-token');

export const apiCheckInByQr = (token: string) =>
  request.post(`/check-ins/qr/${token}`);

export const apiCheckInQrStatus = (token: string): Promise<{
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED';
  member_name?: string;
  check_in_at?: string;
  message?: string;
}> => request.get(`/check-ins/qr/${token}/status`);

export const apiWechatOauthUrl = (token: string): Promise<{ url: string }> =>
  request.get('/wechat/oauth-url', { params: { token } });

export const apiWechatQrCheckIn = (token: string, code: string): Promise<{
  status: 'SUCCESS' | 'BIND_REQUIRED';
  id?: number;
  member_name?: string;
  check_in_at?: string;
  bind_token?: string;
}> => request.post(`/check-ins/qr/${token}/wechat`, { code });

export const apiWechatBindAndCheckIn = (payload: { bind_token: string; member_no: string; phone: string }): Promise<{
  status: 'SUCCESS';
  id: number;
  member_name: string;
  check_in_at: string;
}> => request.post('/check-ins/wechat/bind-and-checkin', payload);


// ===== 储值卡消费明细 =====
export interface StoredHistoryItem {
  id: number;
  order_no: string;
  amount: number;
  status: string;
  paid_at: string;
  items: { name: string; qty: number; subtotal: number }[];
}

export const apiStoredCardHistory = (id: number, params?: Record<string, any>): Promise<{ card_no: string; balance: number; list: StoredHistoryItem[]; total: number }> =>
  request.get(`/memberships/${id}/stored-history`, { params });

// ===== 批量续费 =====
export const apiBatchRenew = (b: { ids: number[]; days?: number; count?: number; amount?: number }): Promise<{ success: number; skipped: number; errors: string[] }> =>
  request.post('/memberships/batch-renew', b);
