好，我已经按你**当前初始化文档 + 我们前面确认的最终技术方案**，帮你**完整合并、重排、补齐**成一份 **「可直接照着做、不留坑的最终版开发初始化文档 v1」**。

下面这份你可以 **直接整体复制保存成 `README.md`**，作为这个仓库的权威文档。

---

# Gold Price Monitor（金价监控系统）

**最终初始化与开发文档（v1）**

> 适用场景：
>
> * 国内金价监控（AU）
> * 每分钟抓价
> * 飞书告警
> * Cloudflare Workers + Pages + D1
> * 两人使用，不自建登录（Cloudflare Access）

---

## 1. 系统架构总览

```
┌────────────┐      Cron(1m)      ┌──────────────────┐
│ Cloudflare │ ───────────────▶  │ Scheduled Worker │
│   Cron     │                   │                  │
└────────────┘                   │ - 抓 AU 金价     │
                                 │ - 写 D1          │
                                 │ - 计算跌幅       │
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
        │                  │                       │ （前端 UI）        │
        │ - prices API     │◀──── fetch ────────▶ │ - 金价曲线          │
        │ - trades API     │                       │ - 买卖点标注       │
        │ - reports API    │                       │ - AI 报告查看      │
        └──────────────────┘                       └────────────────────┘
                             ▲
                             │
                    Cloudflare Access
                   （邮箱 OTP，两人）
```

---

## 2. 仓库结构（Monorepo，推荐）

```
gold-price-monitor/
  api/        # Worker（Cron + API + D1）
  web/        # Pages（前端）
```

> Pages 与 Worker **放在同一个 Git 仓库**是推荐做法，便于统一版本与部署。

---

## 3. 环境准备

```bash
node -v           # Node.js 18+
npm install -g pnpm
```

---

## 4. 初始化后端（Worker + D1）

### 4.1 创建 Worker 项目（官方模板）

```bash
pnpm create cloudflare@latest api \
  --template=cloudflare/templates/d1-template
cd api
pnpm install
```

选择：

* TypeScript
* Worker（Module Worker）

---

### 4.2 创建 D1 数据库

```bash
pnpm wrangler d1 create au_gold_db
```

编辑 `api/wrangler.toml`，加入：

```toml
[[d1_databases]]
binding = "DB"
database_name = "au_gold_db"
database_id = "<上一步生成的 ID>"
```

---

### 4.3 启用 Cron（每分钟）

在 `api/wrangler.toml` 中追加：

```toml
[triggers]
crons = ["*/1 * * * *"]
```

---

### 4.4 初始化 D1 Schema（必须）

在 `api/` 下新建 `schema.sql`，包含：

* prices
* alerts
* reports
* trades

然后执行：

```bash
cd api
pnpm wrangler d1 execute au_gold_db --file=./schema.sql
```

> ⚠️ 建表是必须步骤，否则 Worker 写入会失败。

---

## 5. 初始化前端（Cloudflare Pages）

```bash
cd ..
pnpm create cloudflare@latest web --template=cloudflare/templates/vite-react-template
cd web
pnpm install
```

---

## 6. 本地开发

### 6.1 启动 Worker（含 D1）

```bash
cd api
pnpm wrangler dev
```

默认：

```
http://localhost:8787
```

---

### 6.2 启动前端

```bash
cd web
pnpm dev
```

默认：

```
http://localhost:5173
```

前端请求示例：

```ts
fetch("http://localhost:8787/api/prices")
```

---

## 7. 部署方式（推荐）

### 7.1 Worker 部署

```bash
cd api
pnpm wrangler deploy
```

---

### 7.2 Pages 部署（推荐 Git 自动部署）

在 Cloudflare Dashboard：

* Pages → Create project
* 选择 Git 仓库
* **Root directory**：`web`
* **Build command**：`pnpm install && pnpm build`
* **Build output directory**：`dist`

> 推荐这种方式，而不是长期用 `wrangler pages deploy`。

---

## 8. Cloudflare Access（两人使用，核心）

### 8.1 目标

* 不开发登录系统
* 仅允许 **2 个指定邮箱**
* 页面 + 写接口统一受控

---

### 8.2 配置步骤

1. Cloudflare Dashboard → **Zero Trust**
2. Access → Applications → **Add application**
3. 类型：**Self-hosted**
4. 域名：

   ```
   web.example.com
   ```
5. Policy：

   * Action：Allow
   * Include：Emails
   * 填入两个人邮箱
6. 登录方式：**Email One-time PIN**

---

### 8.3 效果

* 访问 Pages 必须邮箱验证码
* Worker API 自动只接受已登录用户请求
* Cron 不受影响

---

## 9. API 约定（Worker）

### 9.1 价格数据

```
GET /api/prices?from=ts&to=ts
```

---

### 9.2 买卖点标注

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

### 9.3 AI 报告

```
GET /api/reports
```

---

## 10. 告警与 AI 规则（v1）

### 跌幅阈值

* WARN

  * 1m ≤ -0.3% 或 5m ≤ -0.8%
* CRIT

  * 1m ≤ -0.8% 或 5m ≤ -1.5%

### AI 触发

* 仅 CRIT
* 同一品种 30 分钟最多一次

---

## 11. CORS（如果不同子域）

若：

* Pages：`https://web.example.com`
* Worker：`https://api.example.com`

Worker 必须返回：

```http
Access-Control-Allow-Origin: https://web.example.com
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 12. 免费额度控制要点

### Worker

* 每分钟 ≤ 3 次 D1 查询
* AI 调用只在 CRIT

### D1

* 所有查询命中 `(symbol, ts)` 索引
* 禁止全表扫描

### Pages

* 默认只拉最近 24h（1440 点）

---

## 13. Troubleshooting

### wrangler 账号不对

```bash
pnpm wrangler whoami
pnpm wrangler login
```

若仍错误：

* 清理本地 `.wrangler` 缓存
* 或使用 Cloudflare API Token

---

## 14. v1 明确不做的事

* 不支持多品种
* 不做用户系统
* 不做多告警渠道
* 不做复杂权限

---

## 15. 下一步推荐顺序

1. 完成 schema.sql
2. 实现 Worker `scheduled()` 抓价
3. 接入免费金价数据源
4. 飞书告警
5. Pages 图表 + 标注

---