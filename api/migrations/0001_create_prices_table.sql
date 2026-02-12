-- Migration: 0001 - Create prices table (金价分钟线)
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主键
  symbol TEXT NOT NULL, -- 品种/资产标识
  ts INTEGER NOT NULL, -- 时间戳(秒)
  price REAL NOT NULL, -- 报价
  xau_price REAL NOT NULL, -- XAU 参考价
  source TEXT, -- 数据来源
  meta TEXT -- 额外信息(json/text)
);

CREATE UNIQUE INDEX uniq_prices_symbol_ts
  ON prices(symbol, ts);

CREATE INDEX idx_prices_symbol_ts
  ON prices(symbol, ts);

CREATE INDEX idx_prices_ts
  ON prices(ts);
