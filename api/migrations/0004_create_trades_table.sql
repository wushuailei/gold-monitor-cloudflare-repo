-- Migration: 0004 - Create trades table (手动买卖点)
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主键
  ts INTEGER NOT NULL, -- 时间戳(秒)
  symbol TEXT NOT NULL, -- 品种/资产标识
  side TEXT NOT NULL, -- 方向(买/卖)
  price REAL NOT NULL, -- 成交价
  qty REAL, -- 数量
  note TEXT -- 备注
);

CREATE INDEX idx_trades_symbol_ts
  ON trades(symbol, ts);

CREATE INDEX idx_trades_ts
  ON trades(ts);
