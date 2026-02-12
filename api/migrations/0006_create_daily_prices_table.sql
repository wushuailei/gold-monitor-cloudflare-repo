-- Migration: 0006 - Create daily_prices table (日线汇总)

DROP TABLE IF EXISTS daily_prices;

CREATE TABLE IF NOT EXISTS daily_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主键
  symbol TEXT NOT NULL, -- 品种/资产标识
  day_ts INTEGER NOT NULL, -- 当日0点时间戳(北京时间)
  max_price REAL NOT NULL, -- 当日最高价
  min_price REAL NOT NULL, -- 当日最低价
  max_ts INTEGER NOT NULL, -- 最高价出现时间戳(秒)
  min_ts INTEGER NOT NULL, -- 最低价出现时间戳(秒)
  last_updated INTEGER NOT NULL -- 最后更新时间戳(秒)
);

CREATE UNIQUE INDEX uniq_daily_prices_symbol_day
  ON daily_prices(symbol, day_ts);

CREATE INDEX idx_daily_prices_day_ts
  ON daily_prices(day_ts);
