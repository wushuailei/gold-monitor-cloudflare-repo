-- Migration: 0007 - Create global_configs table (全局配置)
CREATE TABLE IF NOT EXISTS global_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE, -- 品种标识，唯一
  rise_1 REAL, -- 涨幅一级节点(%)
  rise_2 REAL, -- 涨幅二级节点(%)
  rise_3 REAL, -- 涨幅三级节点(%)
  fall_1 REAL, -- 跌幅一级节点(%)
  fall_2 REAL, -- 跌幅二级节点(%)
  fall_3 REAL, -- 跌幅三级节点(%)
  updated_ts INTEGER NOT NULL -- 最后更新时间戳(秒)
);

CREATE INDEX idx_global_configs_symbol ON global_configs(symbol);

-- 插入默认配置
INSERT INTO global_configs (symbol, rise_1, rise_2, rise_3, fall_1, fall_2, fall_3, updated_ts)
VALUES ('AU', 1.0, 2.0, 3.0, 1.0, 2.0, 3.0, strftime('%s', 'now'));
