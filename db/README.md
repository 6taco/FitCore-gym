# 数据库说明

## 初始化步骤

1. 确认本地 MySQL 可用，用户 `root` 密码 `123456`。
2. 导入 `schema.sql` 创建数据库 `jianshenfang` 及全部表：

```powershell
mysql -uroot -p123456 < d:\健身房管理系统\db\schema.sql
```

3. 回到项目根目录，执行 `npm run db:seed` 写入初始账号与示例数据。

## 表清单（Pause 1）

| 表 | 说明 |
| --- | --- |
| roles | 角色 |
| permissions | 权限 |
| role_permissions | 角色-权限关联 |
| users | 系统用户 |
| members | 会员档案 |
| body_measurements | 体测记录 |
| membership_plans | 卡种模板 |
| memberships | 会员卡 |
| coaches | 教练 |
| courses | 课程 |
| course_schedules | 排期 |
| bookings | 预约 |
| products | 商品 |
| stock_movements | 库存流水 |
| orders | 订单 |
| order_items | 订单明细 |
| payments | 支付流水 |
| audit_logs | 操作日志 |
