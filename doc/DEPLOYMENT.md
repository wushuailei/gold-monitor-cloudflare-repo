# 部署指南

本文档提供金价监控系统的快速部署步骤。

系统由两部分组成：
- **后端 API**：Cloudflare Workers
- **前端 Web**：Cloudflare Pages

> 环境变量详细说明请参考 [环境变量配置指南](./ENVIRONMENT.md)

---

## 前置准备

### 1. 安装工具

```bash
# 安装 Node.js（18+）
node --version

# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 2. 获取飞书 Webhook

飞书群聊 → 右上角 `···` → `设置` → `群机器人` → `添加机器人` → `自定义机器人` → 复制 Webhook 地址

---

## 第一步：创建 Cloudflare 资源

### 1. 创建 D1 数据库

```bash
cd api
npx wrangler d1 create au_gold_db
```

**输出示例**：
```
✅ Successfully created DB 'au_gold_db'!

[[d1_databases]]
binding = "DB"
database_name = "au_gold_db"
database_id = "92bb6ca3-e4fd-4766-b575-cdfa34205575"
```

**记录 `database_id`**，然后更新 `api/wrangler.json`：

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "au_gold_db",
      "database_id": "你的-database-id"
    }
  ]
}
```

### 2. 创建 KV 命名空间

```bash
npx wrangler kv namespace create KV
```

**输出示例**：
```
✅ Successfully created KV namespace!

[[kv_namespaces]]
binding = "KV"
id = "3e7ecee5f7574153a1e74c04d4c91c41"
```

**记录 `id`**，然后更新 `api/wrangler.json`：

```json
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "你的-kv-id"
    }
  ]
}
```

---

## 第二步：配置环境变量

> 详细配置说明请参考 [环境变量配置指南](./ENVIRONMENT.md)

### 必填配置

```bash
cd api

# 配置飞书 Webhook
npx wrangler secret put FEISHU_WEBHOOK
# 粘贴 Webhook 地址后按回车
```

### 可选配置（AI 功能）

如需 AI 分析功能：

```bash
# 配置 AI API Key
npx wrangler secret put AI_API_KEY

# 编辑 api/wrangler.json 添加：
# "vars": {
#   "AI_API_URL": "https://api.openai.com/v1/chat/completions",
#   "AI_MODEL": "gpt-4o-mini"
# }
```

### 验证配置

```bash
npx wrangler secret list
```

---

## 第三步：初始化数据库

### 1. 执行数据库迁移

```bash
cd api

# 按顺序执行所有迁移文件
npx wrangler d1 execute au_gold_db --remote --file=migrations/0001_create_prices_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0002_create_alerts_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0003_create_reports_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0004_create_trades_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0005_create_user_configs_table.sql
npx wrangler d1 execute au_gold_db --remote --file=migrations/0006_create_daily_prices_table.sql
```

### 2. 验证数据库

```bash
# 查看数据库表
npx wrangler d1 execute au_gold_db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**应该看到**：
- prices
- alerts
- reports
- trades
- user_configs
- daily_prices

---

## 第四步：部署后端 API

### 1. 安装依赖

```bash
cd api
npm install
```

### 2. 部署到 Cloudflare Workers

```bash
npx wrangler deploy
```

**输出示例**：
```
✨ Built successfully!
✨ Successfully published your script to
   https://gold-monitor-api.domielabbott.workers.dev
```

**记录你的 Workers 地址**，格式为：`https://xxx.workers.dev`

### 3. 测试后端 API

访问测试接口：
```bash
curl https://你的-worker-地址.workers.dev/api/test/feishu
```

应该收到飞书群消息。

---

## 第五步：部署前端 Web

### 方式一：命令行部署（纯静态）

```bash
cd web

# 1. 配置 API 地址（编辑 web/.env.production）
# VITE_API_BASE=https://你的-worker-地址.workers.dev

# 2. 安装依赖并构建
npm install
npm run build:prod

# 3. 部署到 Pages
npx wrangler pages deploy dist --project-name=gold-monitor
```

### 方式二：Git 自动部署（推荐）

1. 推送代码到 Git 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
4. 选择仓库并配置：
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `web`
   - 环境变量：`VITE_API_BASE=https://你的-worker-地址.workers.dev`
5. 点击 **Save and Deploy**

部署完成后得到 Pages 地址：`https://gold-monitor.pages.dev`

---

## 第六步：配置 CORS（可选）

仅当前后端在不同域名时需要。在 Cloudflare Dashboard 中：

**Workers & Pages** → 选择 Worker（api）→ **Settings** → **Variables** → 添加：
- 名称：`CORS_ORIGIN`
- 值：`https://gold-monitor.pages.dev`
- 类型：Variable

---

## 第七步：验证部署

### 1. 访问前端

打开浏览器，访问你的 Pages 地址：
```
https://gold-monitor.pages.dev
```

### 2. 测试功能

1. 点击"测试发送"按钮
2. 选择"测试飞书消息"
3. 点击"开始测试"
4. 检查飞书群是否收到消息

### 3. 测试 AI 功能（如果配置了）

1. 点击"测试发送"按钮
2. 选择"测试 AI 分析报告"
3. 点击"开始测试"
4. 检查飞书群是否收到 AI 分析报告

### 4. 检查定时任务

等待 1-2 分钟，系统会自动抓取金价并显示在页面上。

---

## Dashboard 配置检查清单

> 详细配置说明请参考 [环境变量配置指南](./ENVIRONMENT.md)

### Worker（api）配置

**Settings → Variables**：
- ✅ `FEISHU_WEBHOOK` (Secret) - 必填
- ❌ `AI_API_KEY` (Secret) - 可选
- ❌ `REQUIRE_REFERER` (Variable) - 推荐设为 `true`
- ❌ `ALLOWED_ORIGINS` (Variable) - 推荐配置前端域名

**Settings → Bindings**：
- ✅ `DB` → `au_gold_db`
- ✅ `KV` → 你的 KV 名称

**Settings → Triggers**：
- ✅ Cron: `*/1 * * * *`（自动配置）

### Pages（gold-monitor）配置

**Settings → Environment variables → Production**：
- ✅ `VITE_API_BASE` - 你的 Worker 地址

---

## 常见问题

### 前端访问不了

1. 检查 `web/.env.production` 中的 `VITE_API_BASE` 是否正确
2. 确认构建时环境变量生效：`findstr /s "你的域名" web\dist\assets\*.js`
3. 如果前后端不同域名，在 Worker 中配置 `CORS_ORIGIN`

### 定时任务不执行

1. 检查 Worker → Settings → Triggers 中的 Cron 配置
2. 查看 Worker → Logs 中的错误信息
3. 重新部署：`cd api && npx wrangler deploy`

### 飞书收不到消息

1. 验证 `FEISHU_WEBHOOK` 配置：`npx wrangler secret list`
2. 测试接口：`curl -X POST https://你的-worker.workers.dev/api/test/feishu`
3. 检查飞书机器人是否被移除

### AI 功能不工作

1. 确认 `AI_API_KEY` 已配置
2. 检查 `wrangler.json` 中的 `AI_API_URL` 和 `AI_MODEL`
3. 测试：`curl -X POST https://你的-worker.workers.dev/api/test/daily-report`

### 数据库查询失败

1. 验证数据库：`npx wrangler d1 list`
2. 检查迁移是否执行完成
3. 确认 `wrangler.json` 中的 `database_id` 正确

---

## 更新部署

### 后端更新

```bash
cd api && npx wrangler deploy
```

### 前端更新

**命令行方式**：
```bash
cd web && npm run deploy:pages
```

**Git 自动部署**：
```bash
git push origin main
```

Pages 会自动检测并重新部署。

---

## 监控与维护

### 查看日志

```bash
# 实时查看 Worker 日志
npx wrangler tail

# 或在 Dashboard 中查看
# Workers & Pages → 选择项目 → Logs
```

### 数据库备份

```bash
npx wrangler d1 export au_gold_db --remote --output=backup.sql
```

### 成本估算

本系统完全在 Cloudflare 免费额度内：
- Workers: ~2,000 请求/天（免费额度 100,000/天）
- D1: ~10,000 行读取/天（免费额度 5M/天）
- Pages: 无限请求

---

## 安全建议

1. 启用访问控制 - 参考 [访问控制文档](./ACCESS_CONTROL.md)
2. 定期备份数据库
3. 定期轮换 API 密钥
4. 监控 API 使用量

---

## 相关文档

- [环境变量配置](./ENVIRONMENT.md)
- [访问控制](./ACCESS_CONTROL.md)
- [系统架构](./ARCHITECTURE.md)
- [后端 API](../api/README.md)
