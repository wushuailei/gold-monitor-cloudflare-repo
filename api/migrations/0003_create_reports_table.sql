-- Migration: 0003 - Create reports table (AI 分析报告)
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主键
  ts INTEGER NOT NULL, -- 时间戳(秒)
  symbol TEXT NOT NULL, -- 品种/资产标识
  alert_id INTEGER, -- 关联告警ID
  price REAL, -- 报告生成时价格
  context TEXT, -- 输入上下文
  model TEXT, -- 使用的模型
  report_md TEXT, -- 报告内容(Markdown)
  status TEXT, -- 生成状态
  error TEXT -- 错误信息
);

CREATE INDEX idx_reports_symbol_ts
  ON reports(symbol, ts);

CREATE INDEX idx_reports_ts
  ON reports(ts);
