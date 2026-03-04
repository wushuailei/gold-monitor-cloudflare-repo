-- Migration: 0013 - Add open/close price to daily_prices
-- 添加开盘价、收盘价字段

ALTER TABLE daily_prices ADD COLUMN open_price REAL;
ALTER TABLE daily_prices ADD COLUMN open_ts INTEGER;
ALTER TABLE daily_prices ADD COLUMN close_price REAL;
ALTER TABLE daily_prices ADD COLUMN close_ts INTEGER;

-- 更新注释说明：
-- open_price: 北京时间 9:00 开盘价
-- open_ts: 开盘价时间戳
-- close_price: 北京时间 24:00 (次日 0:00) 收盘价
-- close_ts: 收盘价时间戳
