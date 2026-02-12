# Gold Price Monitor API

基于 Cloudflare Workers + D1 的黄金价格监控 API，提供定时抓取金价、涨跌幅告警、目标价提醒、AI 分析等功能。

## 环境变量

详细配置请参考 [环境变量配置文档](../doc/ENVIRONMENT.md)。

### 快速配置

**本地开发**：

复制示例文件并填写配置：
```bash
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 填写实际的配置值
```

**生产环境**：

使用 wrangler 命令设置 secrets：
```bash
# 必填
npx wrangler secret put FEISHU_WEBHOOK

# 可选（AI 功能）
npx wrangler secret put AI_API_KEY
```

在 `wrangler.json` 中配置普通变量：
```json
{
  "vars": {
    "AI_API_URL": "https://api.openai.com/v1/chat/completions",
    "AI_MODEL": "gpt-4o-mini"
  }
}
```

## 项目结构

```
api/
├── src/
│   ├── index.ts              # Worker 入口（HTTP 路由 + 定时任务）
│   ├── types.ts              # Env 类型定义
│   ├── scheduled/
│   │   ├── index.ts          # 定时任务主流程
│   │   ├── fetchPrice.ts     # 金价抓取
│   │   ├── alertEngine.ts    # 涨跌幅告警引擎
│   │   ├── targetCheck.ts    # 目标价检查
│   │   └── aiAnalysis.ts     # AI 分析报告
│   ├── routes/
│   │   ├── prices.ts         # GET /api/prices
│   │   ├── trades.ts         # GET/POST /api/trades
│   │   ├── reports.ts        # GET /api/reports
│   │   ├── alerts.ts         # GET /api/alerts
│   │   └── targets.ts        # GET/POST/DELETE /api/targets
│   ├── services/
│   │   └── feishu.ts         # 飞书消息发送
│   └── utils/
│       ├── cors.ts           # CORS 处理
│       └── time.ts           # 时间工具函数
├── migrations/               # D1 数据库迁移
├── wrangler.json             # Wrangler 配置
└── package.json
```

## 定时任务流程

每分钟执行（`*/1 * * * *`）：

1. **数据清理** → 每天 00:00（北京时间）清理 360 天前的数据
2. **每日早报** → 每天 09:00（北京时间）发送 AI 市场分析报告
3. **抓取金价** → 写入 `prices` 表
4. **日线汇总** → 更新 `daily_prices` 表（当日最高/最低价）
5. **涨跌幅告警** → 对比昨日收盘价/买入价，按用户配置的节点触发飞书提醒
6. **目标价检查** → 检查 `user_configs` 中的目标价设置，触发后自动关闭

### 每日早报

每天北京时间 09:00 自动生成并发送 AI 市场分析报告到飞书群：

- **基础数据**：当前金价、昨日收盘价、24小时涨跌幅
- **AI 分析**：昨日走势回顾、当前市场状态、今日操作建议
- **数据来源**：最近30分钟价格序列、昨日收盘价对比
- **保存记录**：报告保存到 `reports` 表，trigger_type 为 `DAILY`

使用 KV 存储确保每天只发送一次。

### 数据保留策略

系统自动保留最近 360 天的数据，每天凌晨自动清理超过 360 天的历史记录：

- **prices** (价格分钟线)
- **daily_prices** (日线汇总)
- **alerts** (告警记录)
- **reports** (AI 分析报告)
- **trades** (交易记录)

清理任务使用 KV 存储确保每天只执行一次，避免重复清理。

### 告警引擎规则

- **对比基准**: 昨日收盘价（`YESTERDAY`）、未平仓买入价（`BUY`）
- **节点配置**: 每个用户可设三级涨幅节点（`rise_1/2/3`）和三级跌幅节点（`fall_1/2/3`）
- **去重策略**: 一级节点每天最多提醒 1 次，二级 2 次，三级 3 次
- **目标价**: 支持 `EQ`（等于）、`GTE`（大于等于）、`LTE`（小于等于）三种比较方式

## API 路由

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/prices` | 查询价格记录（分钟线） | `from`, `to` (时间戳，默认24小时，最多360天) |
| GET | `/api/daily-prices` | 查询日线汇总 | `from`, `to` (时间戳，默认7天，最多360天) |
| GET | `/api/trades` | 查询交易记录 | `from`, `to` (时间戳，默认7天，最多360天) |
| POST | `/api/trades` | 新增交易记录 | Body: `{ ts, symbol, side, price, qty?, note? }` |
| GET | `/api/reports` | 查询 AI 分析报告 | `from`, `to`, `limit`, `offset` (默认7天，最多360天) |
| GET | `/api/alerts` | 查询告警记录 | `from`, `to` (时间戳，默认7天，最多360天) |
| GET | `/api/targets` | 查询用户配置 | 无 |
| POST | `/api/targets` | 创建/更新用户配置 | Body: `{ symbol, created_by, target_price?, target_alert, target_cmp, rise_1/2/3?, fall_1/2/3? }` |
| DELETE | `/api/targets/:id` | 删除用户配置 | 路径参数: `id` |
| POST | `/api/test/feishu` | 测试飞书消息发送 | 无 |
| POST | `/api/test/alert` | 测试告警消息发送 | 无 |
| POST | `/api/test/daily-report` | 测试 AI 分析报告生成和发送 | 无 |

### 测试接口

#### POST /api/test/feishu

测试飞书群机器人消息发送功能。

**响应示例**:
```json
{
  "success": true,
  "message": "测试消息已发送到飞书群"
}
```

**错误响应**:
- `400`: FEISHU_WEBHOOK 未配置
- `500`: 发送失败

#### POST /api/test/alert

测试告警消息发送功能。发送一条模拟的涨幅告警消息到飞书群。

**响应示例**:
```json
{
  "success": true,
  "message": "测试告警消息已发送到飞书群"
}
```

**错误响应**:
- `400`: FEISHU_WEBHOOK 未配置
- `500`: 发送失败

#### POST /api/test/daily-report

测试 AI 分析报告生成和发送功能。会立即生成一份市场分析报告并发送到飞书群，同时保存到数据库。

**响应示例**:
```json
{
  "success": true,
  "message": "AI 分析报告已生成并发送到飞书群，同时保存到数据库"
}
```

**错误响应**:
- `400`: FEISHU_WEBHOOK、AI_API_KEY 或 AI_API_URL 未配置
- `500`: 生成报告失败

**注意**: 此接口会消耗 AI API 调用额度，建议仅在测试时使用。

### API 详细说明

#### GET /api/prices
查询金价分钟线数据。

**查询参数**:
- `from` (可选): 起始时间戳（秒），默认为当前时间 - 24小时
- `to` (可选): 结束时间戳（秒），默认为当前时间
- 最多查询 360 天的数据

**响应示例**:
```json
[
  {
    "ts": 1704067200,
    "price": 580.50
  }
]
```

#### GET /api/daily-prices
查询日线汇总数据，包含每日最高价、最低价及其时间。

**查询参数**:
- `from` (可选): 起始时间戳（秒），默认为当前时间 - 7天
- `to` (可选): 结束时间戳（秒），默认为当前时间
- 最多查询 360 天的数据

**响应示例**:
```json
[
  {
    "id": 1,
    "symbol": "AU9999",
    "day_ts": 1704067200,
    "max_price": 585.50,
    "min_price": 578.20,
    "max_ts": 1704089400,
    "min_ts": 1704078600,
    "last_updated": 1704153600
  }
]
```

#### GET /api/trades
查询交易记录。

**查询参数**:
- `from` (可选): 起始时间戳（秒），默认为当前时间 - 7天
- `to` (可选): 结束时间戳（秒），默认为当前时间
- 最多查询 360 天的数据

**响应示例**:
```json
[
  {
    "id": 1,
    "ts": 1704067200,
    "symbol": "AU9999",
    "side": "买",
    "price": 580.50,
    "qty": 10,
    "note": "测试买入"
  }
]
```

#### POST /api/trades
新增交易记录。

**请求体**:
```json
{
  "ts": 1704067200,
  "symbol": "AU9999",
  "side": "买",  // 或 "卖"
  "price": 580.50,
  "qty": 10,  // 可选
  "note": "测试买入"  // 可选
}
```

**响应**:
```json
{
  "success": true
}
```

#### GET /api/alerts
查询告警记录。

**查询参数**:
- `from` (可选): 起始时间戳（秒），默认为当前时间 - 7天
- `to` (可选): 结束时间戳（秒），默认为当前时间
- 最多查询 360 天的数据

**响应示例**:
```json
[
  {
    "id": 1,
    "ts": 1704067200,
    "symbol": "AU9999",
    "created_by": "default_user",
    "alert_type": "RISE",  // TARGET/RISE/FALL
    "base_type": "YESTERDAY",  // TARGET/YESTERDAY/BUY
    "node_level": 1,  // 0/1/2/3
    "price": 582.50,
    "ref_price": 578.00,
    "change_percent": 0.78,
    "status": "sent"
  }
]
```

#### GET /api/reports
查询 AI 分析报告。

**查询参数**:
- `from` (可选): 起始时间戳（秒），默认为当前时间 - 7天
- `to` (可选): 结束时间戳（秒），默认为当前时间
- `limit` (可选): 返回数量限制，默认50，最大100
- `offset` (可选): 偏移量，默认0
- 最多查询 360 天的数据

**响应示例**:
```json
[
  {
    "id": 1,
    "ts": 1704067200,
    "symbol": "AU9999",
    "price": 580.50,
    "model": "gpt-4o-mini",
    "report_md": "## 市场分析\n\n国内金价...",
    "status": "success",
    "error": null
  }
]
```

#### GET /api/targets
查询用户配置（目标价和告警节点）。

**响应示例**:
```json
[
  {
    "id": 1,
    "symbol": "AU9999",
    "created_by": "default_user",
    "target_price": 590.0,
    "target_alert": 1,
    "target_cmp": "GTE",  // EQ/GTE/LTE
    "rise_1": 1.0,
    "rise_2": 2.0,
    "rise_3": 3.0,
    "fall_1": 1.0,
    "fall_2": 2.0,
    "fall_3": 3.0,
    "created_ts": 1704067200
  }
]
```

#### POST /api/targets
创建或更新用户配置。

**请求体**:
```json
{
  "symbol": "AU9999",
  "created_by": "default_user",
  "target_price": 590.0,  // 可选
  "target_alert": 1,  // 0 或 1
  "target_cmp": "GTE",  // EQ/GTE/LTE
  "rise_1": 1.0,  // 可选，涨幅一级节点 (%)
  "rise_2": 2.0,  // 可选，涨幅二级节点 (%)
  "rise_3": 3.0,  // 可选，涨幅三级节点 (%)
  "fall_1": 1.0,  // 可选，跌幅一级节点 (%)
  "fall_2": 2.0,  // 可选，跌幅二级节点 (%)
  "fall_3": 3.0   // 可选，跌幅三级节点 (%)
}
```

**响应**:
```json
{
  "success": true
}
```

#### DELETE /api/targets/:id
删除指定的用户配置。

**路径参数**:
- `id`: 配置ID

**响应**:
```json
{
  "success": true
}
```

## 本地开发

### 前置要求

- Node.js ≥ 18
- pnpm（推荐）或 npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)（已包含在 devDependencies 中）

### 1. 安装依赖

```bash
cd api
pnpm install
```

### 2. 配置本地 Secrets

在 `api/` 目录下创建 `.dev.vars` 文件（该文件不应提交到 Git）：

```env
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/你的webhook-token
AI_API_KEY=你的AI密钥
CORS_ORIGIN=http://localhost:5173
```

> **说明：** `.dev.vars` 是 Wrangler 用于本地开发的 Secrets 文件，等价于线上的 `wrangler secret put`。格式为每行一个 `KEY=VALUE`，无需引号。

飞书 Webhook 获取方式：群设置 → 群机器人 → 添加自定义机器人 → 复制 Webhook 地址。

### 3. 初始化本地数据库并启动

```bash
pnpm dev
```

该命令会自动执行本地 D1 数据库迁移（`migrations/` 目录下的 SQL 文件），然后启动开发服务器。

如果只需要单独迁移数据库：

```bash
pnpm seedLocalD1
```

### 4. 可用的开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 初始化本地 D1 + 启动开发服务器 |
| `pnpm seedLocalD1` | 仅执行本地 D1 数据库迁移 |
| `pnpm check` | TypeScript 类型检查 + 部署预检 |
| `pnpm cf-typegen` | 根据 wrangler.json 生成 Workers 类型 |

## 部署

```bash
# 安装依赖
npm install

# 数据库迁移
npx wrangler d1 migrations apply --remote au_gold_db

# 设置 Secrets
npx wrangler secret put FEISHU_WEBHOOK
npx wrangler secret put AI_API_KEY
npx wrangler secret put CORS_ORIGIN

# 部署
npx wrangler deploy
```
