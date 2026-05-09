import request from './request';

export interface SettingItem { key: string; value: string; label: string }

export const apiSettings = (): Promise<Record<string, SettingItem[]>> =>
  request.get('/system/settings');

export const apiUpdateSettings = (data: Record<string, string>) =>
  request.put('/system/settings', data);
