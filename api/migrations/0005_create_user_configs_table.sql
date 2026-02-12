-- Migration: 0005 - Create user_configs table (用户配置)
CREATE TABLE IF NOT EXISTS user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主键
  symbol TEXT NOT NULL, -- 品种/资产标识
  created_by TEXT NOT NULL, -- 创建人/用户
  target_price REAL, -- 目标价
  target_alert INTEGER NOT NULL DEFAULT 0, -- 目标价是否提醒
  target_cmp TEXT NOT NULL DEFAULT 'GTE', -- 目标价比较方式(EQ/GTE/LTE)
  rise_1 REAL, -- 涨幅一级节点(%)
  rise_2 REAL, -- 涨幅二级节点(%)
  rise_3 REAL, -- 涨幅三级节点(%)
  fall_1 REAL, -- 跌幅一级节点(%)
  fall_2 REAL, -- 跌幅二级节点(%)
  fall_3 REAL, -- 跌幅三级节点(%)
  created_ts INTEGER NOT NULL -- 创建时间戳(秒)
);

-- 每人每个品种只能有一个配置
CREATE UNIQUE INDEX uniq_user_configs_user_symbol
  ON user_configs(symbol, created_by);

CREATE INDEX idx_user_configs_symbol
  ON user_configs(symbol);

CREATE INDEX idx_user_configs_created_ts
  ON user_configs(created_ts);
