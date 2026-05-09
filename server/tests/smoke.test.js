import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

let token;

describe('健身房管理系统 · 冒烟测试', () => {
  // 健康检查
  test('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.status).toBe('up');
  });

  // 登录
  test('POST /api/auth/login admin → token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.token).toBeTruthy();
    token = res.body.data.token;
  });

  // 无 token 访问受保护路由
  test('GET /api/members → 401 without token', async () => {
    const res = await request(app).get('/api/members');
    expect(res.status).toBe(401);
  });

  // 有 token 访问会员列表
  test('GET /api/members → 200 with token', async () => {
    const res = await request(app)
      .get('/api/members')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
  });

  // 商品列表
  test('GET /api/products → 200', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 报表
  test('GET /api/reports/month-revenue → 200', async () => {
    const res = await request(app)
      .get('/api/reports/month-revenue')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.revenue).toBe('number');
  });

  // Dashboard API
  test('GET /api/dashboard/revenue-trend → 200', async () => {
    const res = await request(app)
      .get('/api/dashboard/revenue-trend')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(7);
  });

  // 错误密码
  test('POST /api/auth/login wrong password → fail', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.body.code).not.toBe(0);
  });
});
