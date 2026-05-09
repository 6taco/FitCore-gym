-- =====================================================================
-- 健身房管理系统 数据库 DDL  (Pause 1)
-- 数据库：jianshenfang      字符集：utf8mb4     引擎：InnoDB
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `jianshenfang`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `jianshenfang`;

SET FOREIGN_KEY_CHECKS = 0;

-- -------- 1. 角色 --------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(32)  NOT NULL COMMENT '角色编码',
  `name`        VARCHAR(64)  NOT NULL COMMENT '角色名称',
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色';

-- -------- 2. 权限 --------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`       VARCHAR(64)  NOT NULL COMMENT '权限编码，例如 member:create',
  `name`       VARCHAR(64)  NOT NULL,
  `module`     VARCHAR(32)  NOT NULL COMMENT '所属模块',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permissions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限';

-- -------- 3. 角色-权限 --------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id`       INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-权限';

-- -------- 4. 用户（登录账号） --------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(64)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `real_name`     VARCHAR(64)  DEFAULT NULL,
  `phone`         VARCHAR(20)  DEFAULT NULL,
  `avatar`        VARCHAR(255) DEFAULT NULL,
  `role_id`       INT UNSIGNED NOT NULL COMMENT '主角色',
  `status`        TINYINT      NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  `last_login_at` DATETIME     DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  KEY `idx_users_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户';

-- -------- 5. 会员 --------
DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_no`     VARCHAR(32)  NOT NULL COMMENT '会员编号',
  `user_id`       INT UNSIGNED DEFAULT NULL COMMENT '关联登录账号（可空）',
  `wechat_openid` VARCHAR(64)  DEFAULT NULL COMMENT '微信 openid（绑定后可扫码签到）',
  `wechat_bound_at` DATETIME   DEFAULT NULL COMMENT '微信绑定时间',
  `name`          VARCHAR(64)  NOT NULL,
  `gender`        TINYINT      DEFAULT 0 COMMENT '0未知 1男 2女',
  `birthday`      DATE         DEFAULT NULL,
  `phone`         VARCHAR(20)  DEFAULT NULL,
  `id_card`       VARCHAR(32)  DEFAULT NULL,
  `avatar`        VARCHAR(255) DEFAULT NULL,
  `height_cm`     DECIMAL(5,2) DEFAULT NULL,
  `weight_kg`     DECIMAL(5,2) DEFAULT NULL,
  `tags`          VARCHAR(255) DEFAULT NULL COMMENT '逗号分隔标签',
  `remark`        VARCHAR(500) DEFAULT NULL,
  `status`        TINYINT      NOT NULL DEFAULT 1 COMMENT '1正常 0停用',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_members_no` (`member_no`),
  UNIQUE KEY `uk_members_wechat_openid` (`wechat_openid`),
  KEY `idx_members_phone` (`phone`),
  KEY `idx_members_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员档案';

-- -------- 6. 体测记录 --------
DROP TABLE IF EXISTS `body_measurements`;
CREATE TABLE `body_measurements` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id`  INT UNSIGNED NOT NULL,
  `measured_at` DATETIME    NOT NULL,
  `height_cm`  DECIMAL(5,2) DEFAULT NULL,
  `weight_kg`  DECIMAL(5,2) DEFAULT NULL,
  `body_fat`   DECIMAL(5,2) DEFAULT NULL COMMENT '体脂率 %',
  `muscle_kg`  DECIMAL(5,2) DEFAULT NULL,
  `bmi`        DECIMAL(5,2) DEFAULT NULL,
  `remark`     VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bm_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体测记录';

-- -------- 7. 卡种模板 --------
DROP TABLE IF EXISTS `membership_plans`;
CREATE TABLE `membership_plans` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(32)  NOT NULL,
  `name`        VARCHAR(64)  NOT NULL,
  `type`        VARCHAR(16)  NOT NULL COMMENT 'PERIOD/COUNT/STORED',
  `price`       DECIMAL(10,2) NOT NULL,
  `duration_days` INT         DEFAULT NULL COMMENT '有效期(天) 期限卡',
  `total_count` INT         DEFAULT NULL COMMENT '总次数 次卡',
  `initial_balance` DECIMAL(10,2) DEFAULT NULL COMMENT '初始储值金额 储值卡',
  `description` VARCHAR(500) DEFAULT NULL,
  `status`      TINYINT      NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plans_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡种模板';

-- -------- 8. 会员卡（会籍实例） --------
DROP TABLE IF EXISTS `memberships`;
CREATE TABLE `memberships` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id`     INT UNSIGNED NOT NULL,
  `plan_id`       INT UNSIGNED NOT NULL,
  `card_no`       VARCHAR(32)  NOT NULL,
  `start_date`    DATE         NOT NULL,
  `end_date`      DATE         DEFAULT NULL,
  `remaining_count` INT        DEFAULT NULL,
  `balance`       DECIMAL(10,2) DEFAULT NULL,
  `status`        VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/SUSPENDED/EXPIRED/CANCELLED',
  `suspended_at`  DATETIME     DEFAULT NULL COMMENT '挂起时间（用于恢复时补偿天数）',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_memberships_card` (`card_no`),
  KEY `idx_memberships_member` (`member_id`),
  KEY `idx_memberships_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员卡';

-- -------- 9. 教练 --------
DROP TABLE IF EXISTS `coaches`;
CREATE TABLE `coaches` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED DEFAULT NULL,
  `name`        VARCHAR(64)  NOT NULL,
  `gender`      TINYINT      DEFAULT 0,
  `phone`       VARCHAR(20)  DEFAULT NULL,
  `avatar`     VARCHAR(255) DEFAULT NULL,
  `specialty`   VARCHAR(255) DEFAULT NULL COMMENT '擅长项目',
  `intro`       VARCHAR(1000) DEFAULT NULL,
  `hire_date`   DATE         DEFAULT NULL,
  `status`      TINYINT      NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_coaches_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教练';

-- -------- 10. 课程 --------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(32)  NOT NULL,
  `name`        VARCHAR(64)  NOT NULL,
  `type`        VARCHAR(16)  NOT NULL COMMENT 'GROUP团课/PERSONAL私教',
  `duration_min` INT         NOT NULL DEFAULT 60,
  `capacity`    INT          DEFAULT NULL COMMENT '团课容量',
  `price`       DECIMAL(10,2) DEFAULT NULL COMMENT '私教单价',
  `description` VARCHAR(1000) DEFAULT NULL,
  `status`      TINYINT      NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_courses_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程';

-- -------- 11. 课程排期 --------
DROP TABLE IF EXISTS `course_schedules`;
CREATE TABLE `course_schedules` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `course_id`   INT UNSIGNED NOT NULL,
  `coach_id`    INT UNSIGNED NOT NULL,
  `start_time`  DATETIME     NOT NULL,
  `end_time`    DATETIME     NOT NULL,
  `location`    VARCHAR(64)  DEFAULT NULL,
  `capacity`    INT          DEFAULT NULL,
  `booked_count` INT         NOT NULL DEFAULT 0,
  `status`      VARCHAR(16)  NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN/CLOSED/CANCELLED',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cs_course` (`course_id`),
  KEY `idx_cs_coach` (`coach_id`),
  KEY `idx_cs_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程排期';

-- -------- 12. 预约 --------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `schedule_id` INT UNSIGNED NOT NULL,
  `member_id`   INT UNSIGNED NOT NULL,
  `status`      VARCHAR(16)  NOT NULL DEFAULT 'BOOKED' COMMENT 'BOOKED/CHECKED_IN/CANCELLED/NO_SHOW',
  `checked_in_at` DATETIME  DEFAULT NULL,
  `remark`      VARCHAR(255) DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bookings_schedule_member` (`schedule_id`, `member_id`),
  KEY `idx_bookings_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程预约';

-- -------- 13. 商品 --------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(32)  NOT NULL,
  `name`        VARCHAR(64)  NOT NULL,
  `category`    VARCHAR(32)  DEFAULT NULL,
  `price`       DECIMAL(10,2) NOT NULL,
  `cost`        DECIMAL(10,2) DEFAULT NULL,
  `stock`       INT          NOT NULL DEFAULT 0,
  `stock_alert` INT          DEFAULT NULL COMMENT '库存预警阈值',
  `unit`        VARCHAR(16)  DEFAULT '件',
  `status`      TINYINT      NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品';

-- -------- 14. 库存流水 --------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  INT UNSIGNED NOT NULL,
  `type`        VARCHAR(16)  NOT NULL COMMENT 'IN入库/OUT出库/ADJUST盘点',
  `quantity`    INT          NOT NULL,
  `before_stock` INT         NOT NULL,
  `after_stock` INT         NOT NULL,
  `ref_type`    VARCHAR(32)  DEFAULT NULL COMMENT '关联单据类型',
  `ref_id`      INT UNSIGNED DEFAULT NULL,
  `remark`      VARCHAR(255) DEFAULT NULL,
  `operator_id` INT UNSIGNED DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sm_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存流水';

-- -------- 15. 订单 --------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`     VARCHAR(32)  NOT NULL,
  `member_id`    INT UNSIGNED DEFAULT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `paid_amount`  DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount`     DECIMAL(10,2) NOT NULL DEFAULT 0,
  `status`       VARCHAR(16)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/PAID/REFUNDED/CANCELLED',
  `operator_id`  INT UNSIGNED DEFAULT NULL,
  `remark`       VARCHAR(255) DEFAULT NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_no` (`order_no`),
  KEY `idx_orders_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单';

-- -------- 16. 订单明细 --------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`     INT UNSIGNED NOT NULL,
  `item_type`    VARCHAR(16)  NOT NULL COMMENT 'PLAN/PRODUCT/COURSE',
  `item_id`      INT UNSIGNED NOT NULL,
  `item_name`    VARCHAR(128) NOT NULL,
  `unit_price`   DECIMAL(10,2) NOT NULL,
  `quantity`     INT          NOT NULL DEFAULT 1,
  `subtotal`     DECIMAL(10,2) NOT NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细';

-- -------- 17. 支付流水 --------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`    INT UNSIGNED NOT NULL,
  `method`      VARCHAR(16)  NOT NULL COMMENT 'CASH/WECHAT/ALIPAY/CARD',
  `amount`      DECIMAL(10,2) NOT NULL,
  `trade_no`    VARCHAR(64)  DEFAULT NULL,
  `status`      VARCHAR(16)  NOT NULL DEFAULT 'SUCCESS' COMMENT 'SUCCESS/REFUNDED/FAILED',
  `paid_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付流水';

-- -------- 18. 操作日志 --------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED DEFAULT NULL,
  `username`    VARCHAR(64)  DEFAULT NULL,
  `module`      VARCHAR(32)  DEFAULT NULL,
  `action`      VARCHAR(32)  DEFAULT NULL,
  `target_type` VARCHAR(32)  DEFAULT NULL,
  `target_id`   VARCHAR(64)  DEFAULT NULL,
  `detail`      TEXT         DEFAULT NULL,
  `ip`          VARCHAR(64)  DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志';

-- -------- 19. 课程评价 --------
DROP TABLE IF EXISTS `course_reviews`;
CREATE TABLE `course_reviews` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `schedule_id` INT UNSIGNED NOT NULL,
  `member_id`   INT UNSIGNED NOT NULL,
  `rating`      TINYINT UNSIGNED NOT NULL DEFAULT 5 COMMENT '1-5星',
  `content`     VARCHAR(500) DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_schedule_member` (`schedule_id`, `member_id`),
  KEY `idx_review_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程评价';

-- -------- 20. 系统设置 --------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`         VARCHAR(64)  NOT NULL,
  `value`       TEXT,
  `label`       VARCHAR(128) DEFAULT NULL COMMENT '显示名',
  `group`       VARCHAR(32)  NOT NULL DEFAULT 'general',
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置';

INSERT INTO `settings` (`key`, `value`, `label`, `group`) VALUES
  ('gym_name', '健身管家', '场馆名称', 'general'),
  ('open_time', '06:00', '营业开始', 'general'),
  ('close_time', '22:00', '营业结束', 'general'),
  ('expire_warn_days', '7', '到期提醒天数', 'notification'),
  ('checkin_duplicate', '0', '允许当日重复签到(0=否 1=是)', 'checkin'),
  ('wechat_appid', '', '微信公众号 AppID', 'checkin'),
  ('wechat_app_secret', '', '微信公众号 AppSecret', 'checkin'),
  ('wechat_oauth_redirect_uri', '', '微信扫码回调地址', 'checkin');

-- -------- 21. 会员入场签到 --------
DROP TABLE IF EXISTS `check_ins`;
CREATE TABLE `check_ins` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id`   INT UNSIGNED NOT NULL,
  `check_in_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `method`      VARCHAR(16)  NOT NULL DEFAULT 'MANUAL' COMMENT 'MANUAL/CARD/QR',
  `operator_id` INT UNSIGNED DEFAULT NULL,
  `remark`      VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_checkin_member` (`member_id`),
  KEY `idx_checkin_time` (`check_in_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员入场签到';

-- -------- 20. 通知消息 --------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL COMMENT '接收人',
  `type`        VARCHAR(32)  NOT NULL DEFAULT 'SYSTEM' COMMENT 'SYSTEM/EXPIRE/BOOKING/STOCK',
  `title`       VARCHAR(128) NOT NULL,
  `content`     TEXT,
  `is_read`     TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内通知';

SET FOREIGN_KEY_CHECKS = 1;
