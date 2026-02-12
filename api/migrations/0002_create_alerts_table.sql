-- Migration: 0002 - Create alerts table (提醒记录)
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主键
  ts INTEGER NOT NULL, -- 时间戳(秒)
  symbol TEXT NOT NULL, -- 品种/资产标识
  created_by TEXT NOT NULL, -- 创建人/用户
  alert_type TEXT NOT NULL, -- 提醒类型(TARGET/RISE/FALL)
  base_type TEXT NOT NULL, -- 对比基准(TARGET/YESTERDAY/BUY)
  node_level INTEGER NOT NULL DEFAULT 0, -- 节点等级(0/1/2/3)
  price REAL NOT NULL, -- 当前价格
  ref_price REAL, -- 对比基准价格
  change_percent REAL, -- 涨跌幅(%)
  status TEXT, -- 发送状态
  error TEXT -- 错误信息
);

CREATE INDEX idx_alerts_symbol_ts
  ON alerts(symbol, ts);

CREATE INDEX idx_alerts_dedup
  ON alerts(symbol, created_by, alert_type, base_type, node_level, ts);
