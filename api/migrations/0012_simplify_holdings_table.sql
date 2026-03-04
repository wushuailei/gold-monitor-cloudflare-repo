-- Migration: 0012 - Simplify holdings table
-- 移除 total_cost 字段，持仓成本由 total_qty * avg_price 计算

-- 重建 holdings 表
DROP TABLE IF EXISTS holdings_new;

CREATE TABLE holdings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  total_qty REAL NOT NULL DEFAULT 0, -- 总持仓克数
  avg_price REAL NOT NULL DEFAULT 0, -- 平均克价
  realized_profit REAL NOT NULL DEFAULT 0, -- 已实现盈亏
  updated_ts INTEGER NOT NULL
);

-- 迁移旧数据
INSERT INTO holdings_new (id, symbol, total_qty, avg_price, realized_profit, updated_ts)
SELECT id, symbol, total_qty, avg_price, realized_profit, updated_ts FROM holdings;

-- 删除旧表
DROP TABLE holdings;

-- 重命名新表
ALTER TABLE holdings_new RENAME TO holdings;

-- 重建索引
CREATE INDEX idx_holdings_symbol ON holdings(symbol);
