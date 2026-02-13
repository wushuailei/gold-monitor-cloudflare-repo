# 环境变量配置指南

本文档说明系统所需的环境变量配置，分为本地开发和生产环境两部分。

---

## 配置概览

| 变量名 | 必填 | 本地配置 | 生产配置 | 说明 |
|--------|------|----------|----------|------|
| `FEISHU_WEBHOOK` | ✅ | `.dev.vars` | Cloudflare Secret | 飞书群机器人地址 |
| `AI_API_KEY` | ❌ | `.dev.vars` | Cloudflare Secret | AI 服务密钥（需要 AI 功能时） |
| `AI_API_URL` | ❌ | `wrangler.json` | `wrangler.json` | AI 服务地址 |
| `AI_MODEL` | ❌ | `wrangler.json` | `wrangler.json` | AI 模型名称 |
| `REQUIRE_REFERER` | ❌ | `.dev.vars` | Dashboard Variable | 启用 Referer 检查（推荐设为 `true`） |
| `ALLOWED_ORIGINS` | ❌ | `.dev.vars` | Dashboard Variable | 允许的来源域名（逗号分隔） |
| `CORS_ORIGIN` | ❌ | `.dev.vars` | Dashboard Variable | 跨域源（前后端分离时） |

---

## 一、本地开发配置

### 1. 后端配置

**位置**：`api/.dev.vars` 和 `api/wrangler.json`

#### 步骤 1：创建 .dev.vars 文件

```bash
cd api
cp .dev.vars.example .dev.vars
```

#### 步骤 2：编辑 .dev.vars 文件

```env
# 必填：飞书群机器人 Webhook
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-id

# 可选：AI 功能（如果需要测试 AI 分析）
AI_API_KEY=sk-your-api-key

# 可选：安全检查（推荐启用）
REQUIRE_REFERER=true
ALLOWED_ORIGINS=localhost:5173,localhost:8787

# 可选：CORS（如果前后端分离开发）
CORS_ORIGIN=http://localhost:5173
```

**获取飞书 Webhook**：
1. 打开飞书群聊
2. 点击右上角 `···` → `设置` → `群机器人`
3. 点击 `添加机器人` → `自定义机器人`
4. 复制生成的 Webhook 地址

#### 步骤 3：编辑 wrangler.json（可选）

如果需要测试 AI 功能，在 `vars` 字段中配置：

```json
{
  "vars": {
    "AI_API_URL": "https://api.openai.com/v1/chat/completions",
    "AI_MODEL": "gpt-4o-mini"
  }
}
```

#### 步骤 4：启动开发服务器

```bash
npm install
npm run dev
```

### 2. 前端配置（可选）

**位置**：`web/.env`

#### 默认行为

- 开发环境默认使用 Mock API，无需启动后端
- 生产构建自动使用真实 API

#### 如果要连接真实后端

创建 `web/.env` 文件：

```env
VITE_USE_MOCK=false
```

然后同时启动前后端：

```bash
# 终端 1：启动后端
cd api && npm run dev

# 终端 2：启动前端
cd web && npm run dev
```

---

## 二、生产环境配置（Cloudflare）

### 1. 创建必要的资源

#### D1 数据库

```bash
cd api
npx wrangler d1 create au_gold_db
```

记录返回的 `database_id`，更新到 `wrangler.json`：

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "au_gold_db",
      "database_id": "your-database-id"
    }
  ]
}
```

#### KV 命名空间

```bash
npx wrangler kv namespace create KV
```

记录返回的 `id`，更新到 `wrangler.json`：

```json
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "your-kv-id"
    }
  ]
}
```

### 2. 在 Cloudflare Dashboard 配置环境变量

#### 方式一：使用 wrangler 命令（推荐）

```bash
cd api

# 必填：飞书 Webhook
npx wrangler secret put FEISHU_WEBHOOK
# 粘贴你的 Webhook 地址，按回车

# 可选：AI API Key（如果需要 AI 功能）
npx wrangler secret put AI_API_KEY
# 粘贴你的 API Key，按回车
```

#### 方式二：在 Cloudflare Dashboard 配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 选择你的 Worker（api）
4. 进入 **Settings** → **Variables**

**只需要添加 Secrets（加密变量）**：

| 变量名 | 类型 | 值 | 必填 |
|--------|------|-----|------|
| `FEISHU_WEBHOOK` | Secret | `https://open.feishu.cn/open-apis/bot/v2/hook/xxx` | ✅ 必填 |
| `AI_API_KEY` | Secret | `sk-your-api-key` | ❌ 可选（需要 AI 功能时） |
| `REQUIRE_REFERER` | Variable | `true` | ❌ 推荐（启用安全检查） |
| `ALLOWED_ORIGINS` | Variable | `gold-monitor.pages.dev,your-domain.com` | ❌ 推荐（配合 Referer 检查） |

**注意**：
- `AI_API_URL`、`AI_MODEL`、`GOLD_API_KEY`、`GOLD_API_URL` 这些变量在 `wrangler.json` 中配置，**不需要**在 Dashboard 中添加
- `CORS_ORIGIN` 通常也不需要，除非前后端分离部署在不同域名

### 3. 在 wrangler.json 配置普通变量

编辑 `api/wrangler.json`：

```json
{
  "vars": {
    "AI_API_URL": "https://api.openai.com/v1/chat/completions",
    "AI_MODEL": "gpt-4o-mini",
  }
}
```

### 4. 运行数据库迁移

```bash
cd api

# 查看迁移文件
ls migrations/

# 执行迁移
npx wrangler d1 execute au_gold_db --remote --file=migrations/0001_create_prices_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0002_create_alerts_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0003_create_reports_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0004_create_trades_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0005_create_user_configs_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0006_create_daily_prices_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0007_create_global_configs_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0008_create_user_targets_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0009_create_holdings_table.sql
```

### 5. 部署后端

```bash
cd api
npx wrangler deploy
```

### 6. 部署前端

```bash
cd web
# npm run build
# npx wrangler pages deploy dist --project-name=gold-monitor
npm run deploy:pages
```

或通过 Cloudflare Dashboard 连接 Git 仓库自动部署。

---

## 三、配置验证

### 本地开发验证

启动开发服务器后，访问：
- 前端：http://localhost:5173
- 后端：http://localhost:8787

点击"测试发送"按钮，测试各项功能。

### 生产环境验证

部署后，访问你的域名：
- 前端：https://your-pages-domain.pages.dev
- 后端：https://your-worker.workers.dev

点击"测试发送"按钮，测试各项功能。

---

## 四、配置对比表

### Secret vs Variable vs wrangler.json

| 配置方式 | 适用场景 | 安全性 | 配置位置 |
|---------|---------|--------|---------|
| **Secret** | 敏感信息（API Key、Webhook） | 加密存储 | Cloudflare Dashboard 或 `wrangler secret` |
| **Variable** | 非敏感配置（域名） | 明文存储 | Cloudflare Dashboard |
| **wrangler.json** | 公开配置（URL、模型名） | 明文存储 | 代码仓库 |

### 本地 vs 生产配置

| 配置项 | 本地开发 | 生产环境 |
|--------|---------|---------|
| **敏感信息** | `.dev.vars` 文件 | Cloudflare Secret |
| **公开配置** | `wrangler.json` | `wrangler.json` |
| **数据库** | 本地 SQLite | Cloudflare D1 |
| **KV 存储** | 本地模拟 | Cloudflare KV |

---

## 五、常见配置场景

### 场景 1：只使用告警功能（不使用 AI）

**本地**：
```env
# api/.dev.vars
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
```

**生产**：
```bash
npx wrangler secret put FEISHU_WEBHOOK
```

### 场景 2：使用完整功能（包括 AI）

**本地**：
```env
# api/.dev.vars
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
AI_API_KEY=sk-xxx
```

```json
// api/wrangler.json
{
  "vars": {
    "AI_API_URL": "https://api.openai.com/v1/chat/completions",
    "AI_MODEL": "gpt-4o-mini"
  }
}
```

**生产**：
```bash
npx wrangler secret put FEISHU_WEBHOOK
npx wrangler secret put AI_API_KEY
```

### 场景 3：前后端分离部署

**本地**：
```env
# api/.dev.vars
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
CORS_ORIGIN=http://localhost:5173
```

**生产**：
```bash
npx wrangler secret put FEISHU_WEBHOOK
```

如果前后端在不同域名，在 `.dev.vars` 或 Dashboard 添加：
```env
CORS_ORIGIN=https://your-frontend-domain.com
```

**注意**：如果前后端在同一域名下（推荐），不需要配置 `CORS_ORIGIN`。

---

## 六、常见问题

### 如何查看已配置的 Secret？

```bash
cd api
npx wrangler secret list
```

注意：只能看到名称，看不到值（安全考虑）。

### 如何更新 Secret？

重新运行 `npx wrangler secret put` 命令即可覆盖。

### 如何删除 Secret？

```bash
npx wrangler secret delete SECRET_NAME
```

### Dashboard 中的 GOLD_API_KEY 和 GOLD_API_URL 可以删除吗？

**可以删除**。这些是预留字段，当前系统不使用。如果你在 Dashboard 中看到这些变量，可以安全删除：

```bash
npx wrangler secret delete GOLD_API_KEY
npx wrangler secret delete GOLD_API_URL
```

或在 Dashboard 中点击删除按钮。

### 我应该在 Dashboard 中配置哪些变量？

**最简配置（只使用告警功能）**：
- `FEISHU_WEBHOOK` (Secret) - 必填

**推荐配置（包含安全检查）**：
- `FEISHU_WEBHOOK` (Secret) - 必填
- `REQUIRE_REFERER` (Variable) - 设为 `true`
- `ALLOWED_ORIGINS` (Variable) - 设为你的前端域名，如 `gold-monitor.pages.dev,your-domain.com`

**完整配置（包括 AI 功能）**：
- `FEISHU_WEBHOOK` (Secret) - 必填
- `AI_API_KEY` (Secret) - 可选
- `REQUIRE_REFERER` (Variable) - 推荐
- `ALLOWED_ORIGINS` (Variable) - 推荐

**其他变量**：
- `AI_API_URL`、`AI_MODEL` → 在 `wrangler.json` 中配置
- `GOLD_API_KEY`、`GOLD_API_URL` → 不需要，可以删除
- `CORS_ORIGIN` → 通常不需要（除非前后端不同域名）

### .dev.vars 文件会被提交到 Git 吗？

不会，已在 `.gitignore` 中排除。这是为了保护敏感信息。

### 为什么有些配置在 wrangler.json，有些在 Dashboard？

- **wrangler.json**：公开配置，可以提交到 Git
- **Dashboard/Secret**：敏感信息，不能提交到 Git

### 本地开发时如何使用生产环境的配置？

不建议。本地开发应该使用独立的测试配置，避免影响生产数据。

---

## 七、安全建议

1. **不要提交 `.dev.vars` 到 Git**
   - 包含敏感信息
   - 已在 `.gitignore` 中排除

2. **定期轮换 API Key**
   - 特别是 AI API Key
   - 避免泄露和滥用

3. **限制飞书 Webhook 访问**
   - 不要公开分享
   - 定期检查消息记录

4. **使用 Cloudflare Access**
   - 保护前端和 API 访问
   - 参考 [访问控制文档](./ACCESS_CONTROL.md)

---

## 相关文档

- [系统架构](./ARCHITECTURE.md)
- [后端 API](../api/README.md)
- [访问控制](./ACCESS_CONTROL.md)
- [定时任务](./SCHEDULED_TASKS.md)
