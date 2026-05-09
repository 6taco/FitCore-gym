# 健身房管理系统

基于 **React + Node.js + MySQL** 的全栈健身房管理系统，覆盖会员、会籍、课程预约、商品库存、收银台、财务报表、数据看板等完整业务场景。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · Vite · TypeScript · Ant Design 5 · Zustand · React Router 6 · ECharts |
| 后端 | Node.js 20 · Express 4 · Sequelize 6 · JWT · Zod · Winston · node-cron |
| 数据库 | MySQL 8 |
| 部署 | Docker Compose（一键启动） |
| 测试 | Jest + Supertest（冒烟测试） |

## 功能概览

- **RBAC 权限**：管理员/前台/教练/会员 四种角色，按钮级权限控制
- **会员管理**：档案 CRUD、标签、体测记录时间线
- **会籍与卡种**：月卡/季卡/年卡/次卡/储值卡模板，办卡/续费/挂起/转让/作废，过期自动清理
- **课程与预约**：团课排课周视图、私教课程库、预约/取消/签到、课时扣减（并发安全）、教练业绩
- **商品与库存**：CRUD、入库/出库/盘点、库存预警
- **收银台**：商品 + 办卡混合结账、多支付方式（现金/微信/支付宝/银行卡/储值卡）
- **订单与退款**：订单列表、详情、退款（自动回退库存）
- **财务报表**：日报/月报、支付方式汇总、每日趋势
- **数据看板**：ECharts 营收趋势、会员增长、热门课程 TOP5、库存预警
- **系统管理**：用户、角色权限、操作日志

## 目录结构

```
健身房管理系统/
├─ client/               # React 前端
│   ├─ src/pages/        # 页面组件（Dashboard/Members/Courses/Finance/System...）
│   ├─ src/api/          # API 封装
│   ├─ Dockerfile
│   └─ nginx.conf
├─ server/               # Express 后端
│   ├─ src/controllers/  # 业务逻辑
│   ├─ src/models/       # Sequelize 模型
│   ├─ src/routes/       # 路由
│   ├─ tests/            # 冒烟测试
│   └─ Dockerfile
├─ db/                   # 数据库 DDL
├─ docs/                 # 设计文档与路线图
├─ docker-compose.yml    # 一键启动
└─ README.md
```

## 快速开始

### 方式一：Docker Compose（推荐）

> 前置条件：已安装 Docker 和 Docker Compose。

```bash
docker compose up -d
```

等待 MySQL 健康检查通过后（约 30 秒），写入种子数据：

```bash
docker compose exec server node scripts/seed.js
```

访问 `http://localhost` 即可。

### 方式二：本地开发

> 前置条件：Node.js 20+、MySQL 8、npm。

```bash
# 1. 安装依赖
npm run install:all

# 2. 初始化数据库
mysql -uroot -p123456 < db/schema.sql

# 3. 配置环境（可选，默认值已足够本地开发）
cp server/.env.example server/.env

# 4. 写入种子数据
npm run db:seed

# 5. 启动
npm run dev
```

- 后端：`http://localhost:4000`（健康检查 `GET /api/health`）
- 前端：`http://localhost:5173`

### 运行测试

```bash
cd server
npm test
```

## 默认账号

| 角色 | 用户名 | 密码 | 权限范围 |
|---|---|---|---|
| 管理员 | admin | admin123 | 全部 |
| 前台 | staff | staff123 | 会员/会籍/课程预约/商品/收银/订单 |
| 教练 | coach | coach123 | 会员查看/课程/预约管理 |
| 会员 | member | member123 | 课程查看/预约查看 |

## 环境变量

详见 `server/.env.example`，主要配置：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | 4000 | 后端端口 |
| `DB_HOST` | 127.0.0.1 | 数据库地址 |
| `DB_NAME` | jianshenfang | 数据库名 |
| `DB_USER` | root | 数据库用户 |
| `DB_PASSWORD` | 123456 | 数据库密码 |
| `JWT_SECRET` | ... | JWT 签名密钥（生产环境务必修改） |

## 阶段里程碑

- [x] Pause 1 · 基础骨架与数据库设计
- [x] Pause 2 · 鉴权与基础管理（RBAC、用户/角色/权限、审计日志）
- [x] Pause 3 · 会员与会籍核心（办卡/续费/挂起/转让/体测/过期提醒）
- [x] Pause 4 · 课程、预约与教练（排课周视图/容量锁/签到扣次/业绩）
- [x] Pause 5 · 商品、订单与财务（收银台/多支付/退款/日月报表）
- [x] Pause 6 · 数据看板、打磨与部署（ECharts/Docker/测试/ErrorBoundary）
