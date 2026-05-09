# 健身房管理系统 · 分期建设方案

一套基于 React + Node.js + MySQL 的全栈健身房管理系统，按 6 个阶段渐进交付，每阶段结束后暂停等待你的确认再进入下一阶段。

## 角色与权限
- **管理员 (admin)**：系统配置、账号与权限、所有模块的读写、报表。
- **前台/员工 (staff)**：会员登记、售卡续卡、收银、课程签到、库存出入。
- **教练 (coach)**：查看排课、学员预约、课时记录、个人业绩。
- **会员 (member)**：个人资料、会籍查询、课程预约、消费与课时记录。

## 功能模块总览
- **会员管理**：档案 CRUD、标签/分组、头像、证件、体测记录。
- **会籍/卡种管理**：卡种模板（月卡/季卡/年卡/次卡/储值卡）、办卡、续费、挂起、转让、过期提醒。
- **课程与预约**：团课排课表、私教课程库、预约/取消/签到、课时扣减、教练课表。
- **员工/教练管理**：档案、岗位、排班、课时/业绩提成。
- **商品与库存**：商品资料（饮料、补剂、周边）、入库/出库、库存预警。
- **财务与订单**：收银台、订单记录、退款、支付方式统计、日/月结。
- **数据看板**：会员增长、活跃度、营收、课程热度、库存周转。
- **系统管理**：用户、角色、权限、操作日志、基础字典。

## 技术栈
- **前端**：React 18 + Vite + TypeScript + Ant Design 5 + Zustand + React Router 6 + Axios + ECharts。
- **后端**：Node.js 20 + Express 4 + Sequelize 6 + JWT + Joi/Zod + Winston 日志。
- **数据库**：MySQL 8，使用迁移脚本 + 种子数据。
- **工程化**：ESLint + Prettier + Husky + Commitlint；可选 Docker Compose 一键启动。

## 目录结构（monorepo）
```
健身房管理系统/
├─ client/        # React 管理后台 + 会员端共用外壳（通过路由区分）
├─ server/        # Express API
├─ db/            # SQL 迁移脚本 + 种子数据
├─ docs/          # 接口文档、ER 图
├─ docker-compose.yml
└─ README.md
```

---

## 阶段划分（每阶段结束暂停确认）

### Pause 1 · 基础骨架与数据库设计  ✅ 已完成
- 初始化 monorepo、client、server 工程与依赖。
- 设计并落库 ER 图：`users`、`roles`、`members`、`membership_plans`、`memberships`、`coaches`、`courses`、`course_schedules`、`bookings`、`products`、`stock_movements`、`orders`、`order_items`、`payments`、`audit_logs` 等约 15 张表。
- 输出 `db/schema.sql` + `db/seed.sql`（含管理员账号、示例卡种、示例课程）。
- 后端统一响应格式、错误处理、日志、健康检查 `/api/health`。
- 前端 App 外壳（登录页 + 主布局 + 侧边菜单占位）。
- **交付验收**：本地 `npm run dev` 启动前后端，数据库可连通，可登录空壳后台。

### Pause 2 · 鉴权与基础管理  ✅ 已完成
- 注册 / 登录 / 登出、JWT 刷新、密码加密 (bcrypt)。
- RBAC 权限中间件 + 前端路由守卫 + 按钮级权限指令。
- 用户、角色、权限管理页面。
- 操作日志记录与查询页。
- **交付验收**：多角色账号可登录，看到不同菜单与按钮。

### Pause 3 · 会员与会籍核心  ✅ 已完成
- 会员档案 CRUD（含搜索、分页、标签、头像、证件）。
- 卡种模板管理；会员办卡、续费、挂起、转让、作废。
- 过期提醒任务（node-cron）与未读消息中心。
- 体测记录时间线。
- **交付验收**：可完整走一遍「新增会员 → 办卡 → 续费」流程。

### Pause 4 · 课程、预约与教练  ✅ 已完成
- 教练档案、排班、课表视图。
- 团课排课（周视图/日视图，拖拽可选）、容量控制、签到。
- 私教课程库、会员预约/取消、课时扣减。
- 教练业绩统计（课时、人次）。
- **交付验收**：会员端可预约课程，教练端可签到，后台可查看课表。

### Pause 5 · 商品、订单与财务  ✅ 已完成
- 商品与库存：入库/出库、库存预警、盘点记录。
- 收银台（办卡 + 商品 + 私教）合单结账，支持多支付方式。
- 订单查询、退款、发票/小票打印模板。
- 日结/月结报表，营收趋势图。
- **交付验收**：可完成一单「办卡 + 蛋白粉」混合收银并看到报表更新。

### Pause 6 · 数据看板、打磨与部署  ✅ 已完成
- 首页 Dashboard：会员增长、活跃度、营收、热门课程、库存周转（ECharts）。
- 全站 UI 统一、空/错/加载状态完善、ErrorBoundary、404、403。
- 单元测试样例 (Jest + Supertest) + 端到端冒烟用例。
- Docker Compose 一键启动；`README.md` 使用说明与截图。
- **交付验收**：一条命令起全栈；Dashboard 数据正确；README 可让新同学独立跑起来。

### Pause 7 · 核心缺陷修复  ✅ 已完成
- 退款自动回退储值卡余额（`refundOrder` 检查 STORED 支付并返还余额）。
- 私教课计费修复（`checkout` 的 PERSONAL 类型正确读取 `course.price`）。
- 续费逻辑修复：过期/挂起卡可续费并自动恢复为 ACTIVE。
- 期限卡挂起/恢复天数补偿：新增 `suspended_at` 字段，恢复时按冻结天数延长到期日。
- `finance.routes.js` 的 `audit()` 中间件参数统一为 `(module, action)` 双参数格式。
- 编号生成器强化：`genNo` 增加时分秒精度 + 重试 10 次 + 失败抛错。
- **交付验收**：退款回退储值卡；过期卡可续费；挂起→恢复后到期日正确延长。

### Pause 8 · 功能补全与体验提升  ✅ 已完成
- 排期编辑功能：`PUT /schedules/:id`，支持修改教练/时间/场地/容量，前端 ScheduleDrawer 编辑按钮。
- 商品列表分页：后端 `findAndCountAll` + 前端 Table pagination。
- 文件上传服务：multer + `/api/upload` + `/uploads` 静态目录。
- JWT Refresh Token：`/auth/refresh` 接口 + 前端 axios 拦截器自动刷新。
- 消息通知中心：`notifications` 表 + CRUD API + 前端铃铛组件 + 过期提醒 cron。
- 数据导出：exceljs，支持会员/订单/商品 Excel 下载。
- API 登录限流：内存限流中间件（60s/10次），保护 login/refresh 端点。
- **交付验收**：排期可编辑；通知铃铛实时显示；导出按钮产出 xlsx 文件；token 静默刷新。

### Pause 9 · 业务功能增强  ✅ 已完成
- 教练绩效排行榜：`GET /coaches/ranking` + 前端 CoachRanking 页面（奖杯、出勤率进度条）。
- 会员入场签到：`check_ins` 表 + `POST /check-ins` + `GET /check-ins` + 前端 CheckIns 页面（搜索签到 + 今日统计）。
- 储值卡消费明细：`GET /memberships/:id/stored-history` 查询 STORED 支付记录关联订单明细。
- 课程评价系统：`course_reviews` 表 + CRUD API（`GET/POST/DELETE /reviews`）+ 唯一约束防重复评价。
- 会员 Excel 导入：`POST /import/members` 使用 exceljs 解析 + 手机号去重 + 事务批量创建。
- 会员卡批量续费：`POST /memberships/batch-renew` 支持按 ids 批量续期/充次/充值。
- **交付验收**：教练排行可按月筛选；签到页快速搜索入场；导入按钮上传 xlsx 并反馈结果；批量续费 API 就绪。

### Pause 10 · 系统完善与体验优化  ✅ 已完成
- 系统全局设置：`settings` 表 + `GET/PUT /system/settings` + 前端 Tabs 设置页（基本/通知/签到分组）。
- 暗色主题切换：Zustand persist store + ConfigProvider darkAlgorithm + 头部 ☀️/🌙 按钮。
- Dashboard 增强：新增「今日签到」统计卡片（第 5 张），5 列自适应布局。
- 会员详情增强：MemberDrawer 新增「签到记录」Tab + 储值卡「消费明细」Tab（含余额/订单号/商品明细）。
- 性能优化：`coachRanking` 从 N+1 改为 3 条批量 SQL；新增 10+ 组合索引（bookings、orders、payments、memberships、notifications）。
- **交付验收**：设置页可修改并保存；主题一键切换持久化；Dashboard 5 卡展示；会员详情一站式查看所有记录。

---

## 建议的工作节奏
- 每个 Pause 预计 1 次完整迭代，结束时我会：
  1. 汇总本阶段产出（文件清单 + 截图/命令）。
  2. 列出已知遗留与下一 Pause 计划。
  3. 等待你的「继续/调整」指令。
- 如果任何阶段你想跳过、合并或扩展（比如加小程序、门禁、营养计划），随时告诉我即可。

## 默认账号（种子数据）
- 管理员：`admin / admin123`
- 前台：`staff / staff123`
- 教练：`coach / coach123`
- 会员：`member / member123`

## 风险与注意事项
- **时区**：统一使用 `Asia/Shanghai`，数据库字段 `DATETIME` + 应用层格式化。
- **金额**：使用 `DECIMAL(10,2)`，避免浮点误差。
- **并发预约**：团课容量使用数据库乐观锁或事务 + 行锁。
- **密码**：bcrypt 存储，禁止明文与弱口令。
- **环境变量**：`.env` 管理数据库、JWT、端口，提供 `.env.example`。
