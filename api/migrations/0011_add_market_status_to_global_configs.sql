-- Migration: 0011 - Add market status to global_configs table
-- 添加市场状态字段，用于控制启停盘

ALTER TABLE global_configs ADD COLUMN market_status TEXT DEFAULT 'OPEN'; -- 市场状态: OPEN(开盘), CLOSED(停盘)
