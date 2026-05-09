-- Migration: 创建 settings 表（Pause 10）
CREATE TABLE IF NOT EXISTS `settings` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`         VARCHAR(64)  NOT NULL,
  `value`       TEXT,
  `label`       VARCHAR(128) DEFAULT NULL COMMENT '显示名',
  `group`       VARCHAR(32)  NOT NULL DEFAULT 'general',
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置';

INSERT IGNORE INTO `settings` (`key`, `value`, `label`, `group`) VALUES
  ('gym_name', '健身管家', '场馆名称', 'general'),
  ('open_time', '06:00', '营业开始', 'general'),
  ('close_time', '22:00', '营业结束', 'general'),
  ('expire_warn_days', '7', '到期提醒天数', 'notification'),
  ('checkin_duplicate', '0', '允许当日重复签到(0=否 1=是)', 'checkin');
