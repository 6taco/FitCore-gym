import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void; config: InternalAxiosRequestConfig }> = [];

function processQueue(error: any) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) { reject(error); }
    else { resolve(request(config)); }
  });
  pendingQueue = [];
}

request.interceptors.response.use(
  (res: AxiosResponse) => {
    const body = res.data;
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data;
      message.error(body.message || '请求失败');
      return Promise.reject(new Error(body.message || '请求失败'));
    }
    return body;
  },
  async (err: AxiosError<any>) => {
    const status = err.response?.status;
    const originalConfig = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (status === 401 && originalConfig && !originalConfig._retry) {
      const rt = useAuthStore.getState().refreshToken;
      if (rt && !originalConfig.url?.includes('/auth/refresh')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject, config: originalConfig });
          });
        }
        originalConfig._retry = true;
        isRefreshing = true;
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken: rt });
          const data = res.data?.data;
          if (data?.token) {
            useAuthStore.getState().setAuth(data.token, data.user, data.refreshToken);
            originalConfig.headers.Authorization = `Bearer ${data.token}`;
            processQueue(null);
            return request(originalConfig);
          }
        } catch {
          processQueue(err);
          useAuthStore.getState().logout();
          message.error('登录已失效，请重新登录');
          if (location.pathname !== '/login') location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        useAuthStore.getState().logout();
        message.error('登录已失效，请重新登录');
        if (location.pathname !== '/login') location.href = '/login';
      }
    } else if (status !== 401) {
      const msg = err.response?.data?.message || err.message || '网络异常';
      message.error(msg);
    }
    return Promise.reject(err);
  },
);

export default request;
