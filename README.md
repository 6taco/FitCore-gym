# FitCore · 健身房综合管理平台

> 基于 **React 18 + Node.js 20 + TypeScript + MySQL 8** 的全栈健身房管理系统，覆盖会员、会籍、课程预约、商品库存、收银台、财务报表、数据看板等完整业务场景。前后端均采用 TypeScript 开发，支持 Docker 一键部署。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · Vite · TypeScript · Ant Design 5 · Zustand · React Router 6 · ECharts |
| 后端 | Node.js 20 · Express 4 · **TypeScript** · Sequelize 6 (class extends Model) · JWT · Zod · Winston · node-cron |
| 缓存 | Redis（可选，降级至内存） |
| 数据库 | MySQL 8 |
| 部署 | Docker Compose（一键启动） |
| 测试 | Jest + Supertest（冒烟测试） |

## 项目亮点

- **全栈 TypeScript**：前端 React + 后端 Express 均为 TypeScript，编译期零错误
- **Sequelize class extends Model**：所有模型使用类继承 + 属性接口，ORM 层类型安全
- **双重校验**：TypeScript 编译期类型安全 + Zod 运行时请求体校验
- **RBAC 权限体系**：4 种角色细化到按钮级别，中间件统一鉴权 + Redis 权限缓存
- **课程预约并发安全**：基于数据库行锁（SELECT ... FOR UPDATE）实现容量控制
- **Redis 缓存（优雅降级）**：权限缓存、API 响应缓存、限流计数，Redis 不可用时自动降级至内存
- **node-cron 定时任务**：自动处理会籍过期 + 即将到期提醒通知
- **ECharts 数据看板**：营收趋势、会员增长、热门课程 TOP5、库存预警
- **Docker Compose 一键启动**，CI/CD 友好

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
FitCore/
├─ client/                  # React 前端（TypeScript）
│   ├─ src/pages/           # 页面组件（Dashboard/Members/Courses/Finance/System...）
│   ├─ src/api/             # API 封装
│   ├─ Dockerfile
│   └─ nginx.conf
├─ server/                  # Express 后端（TypeScript）
│   ├─ src/
│   │   ├─ config/          # 环境变量、数据库连接（env.ts / db.ts）
│   │   ├─ constants/       # 权限字典（permissions.ts）
│   │   ├─ controllers/     # 业务控制器（17 个 .ts）
│   │   ├─ jobs/            # 定时任务（expireMemberships.ts）
│   │   ├─ middleware/      # 鉴权/RBAC/限流/缓存/审计/错误处理（6 个 .ts）
│   │   ├─ models/          # Sequelize 模型 class extends Model（18+ .ts）
│   │   ├─ routes/          # 路由层（7 个 .ts）
│   │   ├─ types/           # Express 类型扩展（express.d.ts）
│   │   ├─ utils/           # 工具函数（logger/redis/response/idGen）
│   │   ├─ app.ts           # Express 应用配置
│   │   └─ index.ts         # 入口文件
│   ├─ scripts/             # 数据库初始化/种子/全量巡检（.ts）
│   ├─ tests/               # 冒烟测试
│   ├─ tsconfig.json        # TypeScript 配置（strict, ES2022, NodeNext）
│   └─ Dockerfile
├─ db/                      # 数据库 DDL（schema.sql）
├─ docker-compose.yml       # 一键启动
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
docker compose exec server npx tsx scripts/seed.ts
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
| `NODE_ENV` | development | 运行环境 |
| `DB_HOST` | 127.0.0.1 | 数据库地址 |
| `DB_PORT` | 3306 | 数据库端口 |
| `DB_NAME` | jianshenfang | 数据库名 |
| `DB_USER` | root | 数据库用户 |
| `DB_PASSWORD` | 123456 | 数据库密码 |
| `JWT_SECRET` | change-me-in-production | JWT 签名密钥（生产环境务必修改） |
| `JWT_EXPIRES_IN` | 2h | Token 有效期 |
| `JWT_REFRESH_SECRET` | change-me | Refresh Token 签名密钥 |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh Token 有效期 |
| `REDIS_HOST` | 127.0.0.1 | Redis 地址（可选，不可用时降级为内存） |
| `REDIS_PORT` | 6379 | Redis 端口 |
| `REDIS_PASSWORD` | (空) | Redis 密码 |
| `LOG_LEVEL` | info | 日志级别 |

## License

MIT
