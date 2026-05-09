-- Migration: 添加 memberships.suspended_at 字段（Pause 7）
-- 用于记录挂起时间，恢复时按冻结天数延长到期日

ALTER TABLE `memberships`
  ADD COLUMN `suspended_at` DATETIME DEFAULT NULL COMMENT '挂起时间（用于恢复时补偿天数）'
  AFTER `status`;
