# 数据库设计（D1）

## 表结构

### 1. prices（金价分钟线）

```sql
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,        -- 品种标识，如 'AU9999'
  ts INTEGER NOT NULL,         -- Unix timestamp（秒）
  price REAL NOT NULL,         -- 国内金价（元/克）
  xau_price REAL NOT NULL,     -- 国际金价参考（美元/盎司）
  source TEXT,                 -- 数据来源
  meta TEXT                    -- 额外信息(json/text)
);

CREATE UNIQUE INDEX uniq_prices_symbol_ts ON prices(symbol, ts);
CREATE INDEX idx_prices_symbol_ts ON prices(symbol, ts);
CREATE INDEX idx_prices_ts ON prices(ts);
```

**说明**：
- `ts` 统一为秒级时间戳
- 唯一索引防止 Cron 抖动导致重复写入
- 最多保留 360 天数据

---

### 2. daily_prices（日线汇总）

```sql
CREATE TABLE IF NOT EXISTS daily_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  day_ts INTEGER NOT NULL,     -- 当日0点时间戳(北京时间)
  max_price REAL NOT NULL,     -- 当日最高价
  min_price REAL NOT NULL,     -- 当日最低价
  max_ts INTEGER NOT NULL,     -- 最高价出现时间戳(秒)
  min_ts INTEGER NOT NULL,     -- 最低价出现时间戳(秒)
  last_updated INTEGER NOT NULL -- 最后更新时间戳(秒)
);

CREATE UNIQUE INDEX uniq_daily_prices_symbol_day ON daily_prices(symbol, day_ts);
CREATE INDEX idx_daily_prices_day_ts ON daily_prices(day_ts);
```

**说明**：
- 每天汇总当日最高价和最低价
- 记录价格出现的具体时间
- 用于长期趋势分析

---

### 3. alerts（告警记录）

```sql
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  created_by TEXT NOT NULL,    -- 创建人/用户
  alert_type TEXT NOT NULL,    -- 提醒类型(TARGET/RISE/FALL)
  base_type TEXT NOT NULL,     -- 对比基准(TARGET/YESTERDAY/BUY)
  node_level INTEGER NOT NULL DEFAULT 0, -- 节点等级(0/1/2/3)
  price REAL NOT NULL,         -- 当前价格
  ref_price REAL,              -- 对比基准价格
  change_percent REAL,         -- 涨跌幅(%)
  status TEXT,                 -- 发送状态
  error TEXT                   -- 错误信息
);

CREATE INDEX idx_alerts_symbol_ts ON alerts(symbol, ts);
CREATE INDEX idx_alerts_dedup ON alerts(symbol, created_by, alert_type, base_type, node_level, ts);
```

**说明**：
- 记录所有告警历史
- 支持涨跌幅告警和目标价告警
- 最多保留 360 天数据

---

### 4. reports（AI 分析报告）

```sql
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  alert_id INTEGER,            -- 关联告警ID
  price REAL,                  -- 报告生成时价格
  context TEXT,                -- 输入上下文
  model TEXT,                  -- 使用的模型
  report_md TEXT,              -- 报告内容(Markdown)
  status TEXT,                 -- 生成状态
  error TEXT                   -- 错误信息
);

CREATE INDEX idx_reports_symbol_ts ON reports(symbol, ts);
CREATE INDEX idx_reports_ts ON reports(ts);
```

**说明**：
- 存储 AI 生成的市场分析报告
- 仅在 CRIT 级别告警时触发
- 最多保留 360 天数据

---

### 5. trades（交易记录）

```sql
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,          -- 方向(买/卖)
  price REAL NOT NULL,         -- 成交价
  qty REAL,                    -- 数量(克)
  note TEXT                    -- 备注
);

CREATE INDEX idx_trades_symbol_ts ON trades(symbol, ts);
CREATE INDEX idx_trades_ts ON trades(ts);
```

**说明**：
- 用户手动记录的买卖点
- 用于图表标注和收益计算
- 最多保留 360 天数据

---

### 6. user_configs（用户配置）

```sql
CREATE TABLE IF NOT EXISTS user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  created_by TEXT NOT NULL,    -- 创建人/用户
  target_price REAL,           -- 目标价
  target_alert INTEGER NOT NULL DEFAULT 0, -- 目标价是否提醒(0/1)
  target_cmp TEXT NOT NULL DEFAULT 'GTE',  -- 目标价比较方式(EQ/GTE/LTE)
  rise_1 REAL,                 -- 涨幅一级节点(%)
  rise_2 REAL,                 -- 涨幅二级节点(%)
  rise_3 REAL,                 -- 涨幅三级节点(%)
  fall_1 REAL,                 -- 跌幅一级节点(%)
  fall_2 REAL,                 -- 跌幅二级节点(%)
  fall_3 REAL,                 -- 跌幅三级节点(%)
  created_ts INTEGER NOT NULL  -- 创建时间戳(秒)
);

CREATE UNIQUE INDEX uniq_user_configs_user_symbol ON user_configs(symbol, created_by);
CREATE INDEX idx_user_configs_symbol ON user_configs(symbol);
CREATE INDEX idx_user_configs_created_ts ON user_configs(created_ts);
```

**说明**：
- 每人每个品种只能有一个配置
- 支持目标价提醒和涨跌幅告警节点配置
- 目标价比较方式：EQ(等于)、GTE(大于等于)、LTE(小于等于)

---

## 数据保留策略

系统每天凌晨自动清理 360 天前的数据：
- prices（价格分钟线）
- daily_prices（日线汇总）
- alerts（告警记录）
- reports（AI 分析报告）
- trades（交易记录）

user_configs 不会自动清理，由用户手动管理。

## 索引策略

所有查询必须命中索引，避免全表扫描：
- 时间范围查询使用 `(symbol, ts)` 复合索引
- 用户配置查询使用 `(symbol, created_by)` 唯一索引
- 告警去重使用专门的去重索引
