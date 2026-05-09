-- Migration: 为旧版 members 表补齐微信绑定字段（兼容扫码签到）

SET @db := DATABASE();

SET @has_openid := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'members' AND COLUMN_NAME = 'wechat_openid'
);
SET @sql := IF(
  @has_openid = 0,
  "ALTER TABLE `members` ADD COLUMN `wechat_openid` VARCHAR(64) DEFAULT NULL COMMENT '微信 openid（绑定后可扫码签到）' AFTER `user_id`",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_bound_at := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'members' AND COLUMN_NAME = 'wechat_bound_at'
);
SET @sql := IF(
  @has_bound_at = 0,
  "ALTER TABLE `members` ADD COLUMN `wechat_bound_at` DATETIME DEFAULT NULL COMMENT '微信绑定时间' AFTER `wechat_openid`",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_openid_index := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'members' AND INDEX_NAME = 'uk_members_wechat_openid'
);
SET @sql := IF(
  @has_openid_index = 0,
  'CREATE UNIQUE INDEX `uk_members_wechat_openid` ON `members` (`wechat_openid`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
