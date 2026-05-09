-- Migration: 创建 check_ins 表（Pause 9）
CREATE TABLE IF NOT EXISTS `check_ins` (
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
