import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  realName?: string;
  avatar?: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export function apiLogin(params: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', params);
}

export function apiProfile(): Promise<AuthUser> {
  return request.get('/auth/profile');
}

export function apiChangePassword(body: { oldPassword: string; newPassword: string }): Promise<null> {
  return request.post('/auth/change-password', body);
}

export function apiHealth(): Promise<{ status: string; timestamp: string }> {
  return request.get('/health');
}
