-- Migration: 0008 - Create user_targets table (用户目标价)
CREATE TABLE IF NOT EXISTS user_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL, -- 品种标识
  target_price REAL NOT NULL, -- 目标价
  target_alert INTEGER NOT NULL DEFAULT 1, -- 是否启用提醒
  target_cmp TEXT NOT NULL DEFAULT 'GTE', -- 比较方式(EQ/GTE/LTE)
  created_ts INTEGER NOT NULL, -- 创建时间戳(秒)
  updated_ts INTEGER NOT NULL -- 最后更新时间戳(秒)
);

CREATE INDEX idx_user_targets_symbol ON user_targets(symbol);
CREATE INDEX idx_user_targets_alert ON user_targets(target_alert);

-- 迁移现有 user_configs 中的目标价数据
INSERT INTO user_targets (symbol, target_price, target_alert, target_cmp, created_ts, updated_ts)
SELECT symbol, target_price, target_alert, target_cmp, created_ts, created_ts
FROM user_configs
WHERE target_price IS NOT NULL;
