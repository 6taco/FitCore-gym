-- Migration: 补充索引（Pause 10 性能优化）

-- bookings: schedule_id + status 组合查询高频
CREATE INDEX IF NOT EXISTS idx_booking_schedule_status ON bookings (schedule_id, status);

-- bookings: member_id 查会员预约
CREATE INDEX IF NOT EXISTS idx_booking_member ON bookings (member_id);

-- course_schedules: coach_id + start_time 排行/排期查询
CREATE INDEX IF NOT EXISTS idx_schedule_coach_time ON course_schedules (coach_id, start_time);

-- orders: member_id 查会员订单
CREATE INDEX IF NOT EXISTS idx_order_member ON orders (member_id);

-- orders: created_at 时间范围查询
CREATE INDEX IF NOT EXISTS idx_order_created ON orders (created_at);

-- payments: method + status 储值消费查询
CREATE INDEX IF NOT EXISTS idx_payment_method_status ON payments (method, status);

-- memberships: member_id + status 查有效卡
CREATE INDEX IF NOT EXISTS idx_membership_member_status ON memberships (member_id, status);

-- memberships: end_date 到期扫描
CREATE INDEX IF NOT EXISTS idx_membership_enddate ON memberships (end_date);

-- notifications: user_id + is_read 未读查询
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notifications (user_id, is_read);
