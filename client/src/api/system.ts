import request from './request';

export interface PageQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ========= 用户 =========
export interface SystemUser {
  id: number;
  username: string;
  real_name?: string;
  phone?: string;
  avatar?: string;
  role_id: number;
  role_code?: string;
  role_name?: string;
  status: number;
  last_login_at?: string;
  created_at: string;
}

export function apiUserList(params: PageQuery & { role_id?: number; status?: number }): Promise<PageResult<SystemUser>> {
  return request.get('/system/users', { params });
}

export function apiUserCreate(body: any) {
  return request.post('/system/users', body);
}

export function apiUserUpdate(id: number, body: any) {
  return request.put(`/system/users/${id}`, body);
}

export function apiUserDelete(id: number) {
  return request.delete(`/system/users/${id}`);
}

export function apiUserResetPassword(id: number, password: string) {
  return request.post(`/system/users/${id}/reset-password`, { password });
}

// ========= 角色 =========
export interface RoleItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  permissionIds: number[];
  permissionCodes: string[];
  created_at: string;
}

export function apiRoleList(): Promise<RoleItem[]> {
  return request.get('/system/roles');
}

export function apiRoleCreate(body: any) {
  return request.post('/system/roles', body);
}

export function apiRoleUpdate(id: number, body: any) {
  return request.put(`/system/roles/${id}`, body);
}

export function apiRoleDelete(id: number) {
  return request.delete(`/system/roles/${id}`);
}

// ========= 权限 =========
export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  module: string;
}

export function apiPermissionList(): Promise<PermissionItem[]> {
  return request.get('/system/permissions');
}

// ========= 操作日志 =========
export interface AuditLogItem {
  id: number;
  user_id?: number;
  username?: string;
  module?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  detail?: string;
  ip?: string;
  created_at: string;
}

export function apiAuditList(params: PageQuery & {
  module?: string;
  action?: string;
  startTime?: string;
  endTime?: string;
}): Promise<PageResult<AuditLogItem>> {
  return request.get('/system/audit-logs', { params });
}
