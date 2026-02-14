-- Migration: 0010 - Add trigger fields to reports table
-- 添加触发类型和触发值字段，用于区分不同类型的报告

ALTER TABLE reports ADD COLUMN trigger_type TEXT; -- 触发类型: DAILY(每日早报), ALERT(告警触发), MANUAL(手动触发)
ALTER TABLE reports ADD COLUMN trigger_value TEXT; -- 触发值: 涨跌幅百分比或其他触发条件
