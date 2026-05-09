-- Migration: 创建 notifications 表（Pause 8）
CREATE TABLE IF NOT EXISTS `notifications` (
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
