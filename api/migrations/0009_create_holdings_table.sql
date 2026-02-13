-- Migration: 0009 - Create holdings table (持仓表)
CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE, -- 品种标识，唯一
  total_qty REAL NOT NULL DEFAULT 0, -- 总持仓数量
  total_cost REAL NOT NULL DEFAULT 0, -- 总成本
  avg_price REAL NOT NULL DEFAULT 0, -- 平均成本价
  realized_profit REAL NOT NULL DEFAULT 0, -- 已实现盈亏
  updated_ts INTEGER NOT NULL -- 最后更新时间戳(秒)
);

CREATE INDEX idx_holdings_symbol ON holdings(symbol);

-- 初始化 AU 的持仓记录
INSERT INTO holdings (symbol, total_qty, total_cost, avg_price, realized_profit, updated_ts)
VALUES ('AU', 0, 0, 0, 0, strftime('%s', 'now'))
ON CONFLICT(symbol) DO NOTHING;
