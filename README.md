# 金价监控系统（AU）开发文档

**技术栈**：Cloudflare Workers + D1 + Pages
**采样频率**：1 分钟
**告警渠道**：飞书群机器人
**AI 分析**：仅 CRIT 级别触发
**当前版本**：v1（单品种 AU）

---

## 1. 系统架构说明

```
┌────────────┐      Cron(1m)      ┌──────────────────┐
│ Cloudflare │ ───────────────▶  │ Scheduled Worker │
│   Cron     │                   │                  │
└────────────┘                   │ - 拉 AU 金价     │
                                 │ - 写 D1          │
                                 │ - 算跌幅         │
                                 │ - 飞书告警       │
                                 │ - CRIT 调 AI     │
                                 └────────┬─────────┘
                                          │
                                D1 (SQLite-like)
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
        ┌──────────────────┐                       ┌────────────────────┐
        │ API Worker       │                       │ Cloudflare Pages   │
        │                  │                       │ (前端页面)         │
        │ - prices API     │◀──── fetch ────────▶ │ - 金价曲线          │
        │ - trades API     │                       │ - 买卖点标注       │
        │ - reports API    │                       │ - AI 报告查看      │
        └──────────────────┘                       └────────────────────┘
```

---

## 2. 数据库设计（D1）

### 2.1 prices（金价分钟线）

```sql
CREATE TABLE prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,        -- 固定为 'AU'
  ts INTEGER NOT NULL,         -- Unix timestamp（秒，取整到分钟）
  price REAL NOT NULL,
  source TEXT,
  meta TEXT
);

CREATE UNIQUE INDEX uniq_prices_symbol_ts
  ON prices(symbol, ts);

CREATE INDEX idx_prices_symbol_ts
  ON prices(symbol, ts);
```

**说明**

* `ts` 统一为 `Math.floor(now / 60000) * 60`
* 唯一索引防止 Cron 抖动导致重复写

---

### 2.2 alerts（告警记录）

```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  change_1m REAL,
  change_5m REAL,
  level TEXT NOT NULL,     -- INFO / WARN / CRIT
  channel TEXT,            -- 'feishu'
  status TEXT,             -- SENT / FAILED
  error TEXT
);

CREATE INDEX idx_alerts_symbol_ts
  ON alerts(symbol, ts);
```

---

### 2.3 reports（AI 分析报告）

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  alert_id INTEGER,
  price REAL,
  context TEXT,            -- JSON（价格序列、阈值等）
  model TEXT,
  report_md TEXT,          -- Markdown
  status TEXT,             -- OK / FAILED
  error TEXT
);

CREATE INDEX idx_reports_symbol_ts
  ON reports(symbol, ts);
```

---

### 2.4 trades（手动买卖点）

```sql
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,      -- BUY / SELL
  price REAL NOT NULL,
  qty REAL,
  note TEXT
);

CREATE INDEX idx_trades_symbol_ts
  ON trades(symbol, ts);
```

---

## 3. Scheduled Worker（每分钟任务）

### 3.1 Cron 配置

```toml
[triggers]
crons = ["*/1 * * * *"]
```

---

### 3.2 每分钟执行流程

```text
1. 计算当前分钟 ts
2. 拉取 AU 最新价格
3. 写入 prices（忽略重复）
4. 查询 1 分钟前价格
5. 查询 5 分钟前价格
6. 计算跌幅
7. 判断告警等级
8. 告警节流检查
9. 发送飞书告警（如需要）
10. CRIT 级别 → 调 AI → 写入 reports
```

---

### 3.3 跌幅计算公式

```text
change_1m = (price_now - price_1m) / price_1m * 100
change_5m = (price_now - price_5m) / price_5m * 100
```

---

### 3.4 告警等级定义（v1 默认）

```ts
WARN:
  change_1m <= -0.3
  OR change_5m <= -0.8

CRIT:
  change_1m <= -0.8
  OR change_5m <= -1.5
```

---

### 3.5 告警节流规则

* 同一 `symbol + level`
* **10 分钟内最多 1 条**

```sql
SELECT ts
FROM alerts
WHERE symbol = 'AU'
  AND level = ?
ORDER BY ts DESC
LIMIT 1;
```

---

## 4. 飞书告警接口

### 4.1 Webhook

* 群自定义机器人
* 类型：`text`（v1）

### 4.2 消息格式（示例）

```json
{
  "msg_type": "text",
  "content": {
    "text": "[AU 金价告警]\n当前价: 478.32\n1分钟跌幅: -0.92%\n5分钟跌幅: -1.63%\n等级: CRIT"
  }
}
```

---

## 5. AI 分析触发规则

### 5.1 触发条件

* 告警等级 = `CRIT`
* 同一 symbol **30 分钟内无成功报告**

### 5.2 AI 输入（示例）

```json
{
  "symbol": "AU",
  "price_now": 478.32,
  "change_1m": -0.92,
  "change_5m": -1.63,
  "recent_prices": [
    { "ts": 1700000000, "price": 482.1 },
    ...
  ]
}
```

### 5.3 AI 输出要求（Markdown）

* 可能原因
* 短线风险
* 操作建议（保守 / 中性 / 激进）

---

## 6. API Worker（供 Pages 使用）

### 6.1 获取价格序列

```
GET /api/prices?from=ts1&to=ts2
```

返回：

```json
[{ "ts": 1700000000, "price": 478.3 }]
```

---

### 6.2 买卖点操作

```
POST /api/trades
```

```json
{
  "ts": 1700000120,
  "side": "BUY",
  "price": 477.8,
  "qty": 2,
  "note": "回调买入"
}
```

---

### 6.3 获取 AI 报告

```
GET /api/reports
```

---

## 7. Pages 前端约定

### 7.1 图表

* 主线：AU 分钟价格
* BUY：绿色向上箭头
* SELL：红色向下箭头

### 7.2 交互

* 点击图表 → 自动带 ts + price
* 弹窗填写 BUY / SELL / note
* 保存即写 `trades`

---

## 8. 免费额度控制要点（必须遵守）

### Worker

* 每分钟任务 **≤ 3 次 D1 查询**
* AI 调用只在 CRIT

### D1

* 禁止全表扫描
* 所有查询必须命中 `(symbol, ts)` 索引

### Pages

* 默认只拉最近 24h（1440 点）

---

## 9. v1 的刻意限制

* 只支持 `symbol = 'AU'`
* 不做多周期聚合（5m / 1h）
* 不做用户系统
* 不支持多告警渠道

---

## —— 加入 Cloudflare Access（两人使用版）

> 本系统 **不实现自定义登录系统**，统一使用 **Cloudflare Access（Zero Trust）**
> 通过 **邮箱一次性验证码（OTP）** 控制访问权限。

---

## 10. 鉴权方案总览（最终形态）

### 鉴权目标

* ✅ 只有 **2 个指定邮箱用户** 可以：

  * 访问前端页面
  * 标注买卖点（写接口）
* ❌ 其他人无法访问页面或调用写接口
* ⚠️ Worker 的 **Cron 定时任务不受影响**

### 采用方案

**Cloudflare Access（Self-hosted Application）**

---

## 11. Cloudflare Access 架构放置点

### 推荐做法（最简单、最稳）

👉 **保护整个 Pages 站点**

```
浏览器
  │
  │ 访问 https://web.example.com
  ▼
Cloudflare Access
  │  (邮箱 OTP 验证)
  ▼
Cloudflare Pages
  │
  └── fetch → https://api.example.com/api/*
                  ▲
                  │
             API Worker（无需再单独鉴权）
```

**好处**

* 不需要在 Worker 里写鉴权逻辑
* 不需要在前端保存 token
* 所有 API 调用天然已鉴权
* 非常适合 2 人 / 小团队

---

## 12. Cloudflare Access 配置步骤（照做）

### 12.1 启用 Zero Trust

1. Cloudflare Dashboard
2. **Zero Trust → Settings → Authentication**
3. 启用登录方式：

   * ✅ **One-time PIN（Email OTP）**
   * 其他（Google / GitHub）可选

---

### 12.2 创建 Access Application（Pages）

1. **Zero Trust → Access → Applications**
2. **Add an application**
3. 类型选择：**Self-hosted**
4. Application 域名：

   ```
   web.example.com
   ```

   （你的 Pages 域名）

---

### 12.3 配置访问策略（Policy）

创建一个 **Allow Policy**：

| 项       | 值        |
| ------- | -------- |
| Action  | Allow    |
| Include | Emails   |
| Emails  | 你们两个人的邮箱 |

示例：

```
wtwelve987@gmail.com
teammate@example.com
```

❌ 不需要 Deny Policy（默认拒绝）

---

### 12.4 保存并生效

* 访问 Pages 域名
* 会被自动重定向到 Cloudflare Access 登录页
* 输入邮箱 → 收验证码 → 登录

---

## 13. Worker 侧的变化（非常重要）

### 13.1 **Worker 不需要实现登录**

因为：

* 所有浏览器请求已经被 Access 验证
* 未通过 Access 的请求 **到不了 Worker**

👉 Worker 可以 **假设请求已是可信用户**

---

### 13.2 Worker Cron 不受影响

* `scheduled()` 不走 HTTP
* 不经过 Access
* 正常每分钟运行

✅ **无需额外配置**

---

## 14. API 设计在 Access 下的约定

### 14.1 API 路由保持不变

```text
GET  /api/prices
GET  /api/reports
POST /api/trades
```

### 14.2 不需要：

* JWT
* Session
* Cookie 校验
* Token Header

（除非未来要做“不同用户权限”）

---

## 15. CORS 配置（简单版）

如果 Pages 和 Worker 在不同子域：

* Pages：`web.example.com`
* Worker：`api.example.com`

Worker 只需允许 Pages 域名：

```ts
headers: {
  "Access-Control-Allow-Origin": "https://web.example.com",
  "Access-Control-Allow-Methods": "GET,POST",
}
```

⚠️ **不要使用 `*`**

---

## 16. 如果以后想更精细（预留但 v1 不做）

### 16.1 只保护写接口

* Access Application 绑定：

  ```
  api.example.com/api/trades*
  ```
* 页面可公开，只写操作需登录

### 16.2 Service Token（非浏览器）

* 给 CI / 自动化 / 未来 App 用
* 当前版本不需要

---

## 17. v1 版本的鉴权边界（明确写清楚）

**v1 明确不做：**

* 用户注册
* 密码管理
* 多角色权限
* 操作审计

**v1 只保证：**

* 只有指定 2 人能访问系统
* 不泄露写接口
* 不增加开发复杂度

---

## 18. 最终结论（你现在最该用的）

> **Pages + Worker 两个应用
> Pages 用 Cloudflare Access 整站保护
> Worker 不写任何登录代码**

