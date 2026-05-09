-- Migration: 创建 course_reviews 表（Pause 9）
CREATE TABLE IF NOT EXISTS `course_reviews` (
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
