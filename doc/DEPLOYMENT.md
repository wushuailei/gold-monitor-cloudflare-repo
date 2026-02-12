# 部署指南

本文档详细说明如何将金价监控系统部署到 Cloudflare。

---

## 部署概览

系统由两部分组成：
- **后端 API**：部署到 Cloudflare Workers
- **前端 Web**：部署到 Cloudflare Pages

---

## 前置准备

### 1. 注册 Cloudflare 账号

访问 [Cloudflare](https://dash.cloudflare.com/sign-up) 注册账号（免费）。

### 2. 安装必要工具

```bash
# 安装 Node.js（18 或更高版本）
node --version

# 安装 pnpm（推荐）或 npm
npm install -g pnpm

# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 3. 获取飞书 Webhook

1. 打开飞书群聊
2. 点击右上角 `···` → `设置` → `群机器人`
3. 点击 `添加机器人` → `自定义机器人`
4. 设置机器人名称（如：金价监控）
5. 复制生成的 Webhook 地址

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

### 1. 配置必填变量（Secrets）

```bash
cd api

# 配置飞书 Webhook（必填）
npx wrangler secret put FEISHU_WEBHOOK
# 粘贴你的 Webhook 地址，按回车
```

### 2. 配置可选变量（AI 功能）

如果需要 AI 分析功能：

```bash
# 配置 AI API Key
npx wrangler secret put AI_API_KEY
# 粘贴你的 API Key（如 OpenAI 或 DeepSeek），按回车
```

然后编辑 `api/wrangler.json`，在 `vars` 字段中添加：

```json
{
  "vars": {
    "AI_API_URL": "https://api.openai.com/v1/chat/completions",
    "AI_MODEL": "gpt-4o-mini"
  }
}
```

**常用 AI 服务配置**：

OpenAI：
```json
{
  "AI_API_URL": "https://api.openai.com/v1/chat/completions",
  "AI_MODEL": "gpt-4o-mini"
}
```

DeepSeek：
```json
{
  "AI_API_URL": "https://api.deepseek.com/v1/chat/completions",
  "AI_MODEL": "deepseek-chat"
}
```

### 3. 验证配置

```bash
# 查看已配置的 Secrets
npx wrangler secret list
```

**应该看到**：
- `FEISHU_WEBHOOK`
- `AI_API_KEY`（如果配置了）

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
   https://api.domielabbott.workers.dev
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

### 方式一：使用 wrangler 命令行部署

#### 1. 配置前端 API 地址

编辑 `web/.env.production`（如果不存在则创建）：

```env
VITE_API_BASE=https://你的-worker-地址.workers.dev
```

#### 2. 构建前端

```bash
cd web
npm install
npm run build
```

#### 3. 部署到 Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=gold-monitor
```

**输出示例**：
```
✨ Success! Uploaded 25 files
✨ Deployment complete!
   https://gold-monitor.pages.dev
```

### 方式二：通过 Cloudflare Dashboard 部署（推荐）

#### 1. 推送代码到 Git 仓库

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. 在 Cloudflare Dashboard 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 选择你的 Git 仓库
5. 配置构建设置：

**构建配置**：
```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: web
```

**环境变量**：
```
VITE_API_BASE=https://你的-worker-地址.workers.dev
```

6. 点击 **Save and Deploy**

#### 3. 等待部署完成

部署完成后，你会得到一个 Pages 地址：
```
https://gold-monitor.pages.dev
```

---

## 第六步：配置 CORS（如果需要）

如果前后端部署在不同域名，需要配置 CORS。

### 在 Cloudflare Dashboard 配置

1. 进入 **Workers & Pages**
2. 选择你的 Worker（api）
3. 进入 **Settings** → **Variables**
4. 添加变量：
   - 名称：`CORS_ORIGIN`
   - 值：`https://你的-pages-地址.pages.dev`
   - 类型：Text（不加密）

### 或使用 wrangler 命令

编辑 `api/.dev.vars`（仅用于记录，不会部署）：
```env
CORS_ORIGIN=https://你的-pages-地址.pages.dev
```

然后在 Dashboard 中手动添加。

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

## Cloudflare Dashboard 配置清单

### Workers & Pages → 你的 Worker（api）

#### Settings → Variables

**Secrets（加密变量）**：
- ✅ `FEISHU_WEBHOOK` - 飞书群机器人地址（必填）
- ❌ `AI_API_KEY` - AI 服务密钥（可选，需要 AI 功能时）

**Variables（普通变量）**：
- ❌ `CORS_ORIGIN` - 跨域源地址（可选，前后端分离时）

**不需要配置的变量**：
- ❌ `AI_API_URL` - 在 wrangler.json 中配置
- ❌ `AI_MODEL` - 在 wrangler.json 中配置
- ❌ `GOLD_API_KEY` - 预留字段，当前未使用
- ❌ `GOLD_API_URL` - 预留字段，当前未使用

#### Settings → Triggers

**Cron Triggers**：
- ✅ 应该看到：`*/1 * * * *`（每分钟执行）
- 这是自动配置的，无需手动添加

#### Settings → Bindings

**D1 Databases**：
- ✅ `DB` → `au_gold_db`

**KV Namespaces**：
- ✅ `KV` → `au_gold_kv` 或你创建的 KV 名称

### Workers & Pages → 你的 Pages（gold-monitor）

#### Settings → Environment variables

**Production**：
- ✅ `VITE_API_BASE` - 你的 Worker 地址（如果前后端分离）

---

## 常见问题

### 1. 部署后前端无法访问后端

**检查**：
- 前端环境变量 `VITE_API_BASE` 是否正确
- 后端是否配置了 `CORS_ORIGIN`
- 浏览器控制台是否有 CORS 错误

**解决**：
```bash
# 在 Dashboard 中添加 CORS_ORIGIN 变量
CORS_ORIGIN=https://你的-pages-地址.pages.dev
```

### 2. 定时任务没有执行

**检查**：
- Workers → Settings → Triggers 中是否有 Cron 配置
- Workers → Logs 中是否有错误信息

**解决**：
```bash
# 重新部署
cd api
npx wrangler deploy
```

### 3. 飞书收不到消息

**检查**：
- `FEISHU_WEBHOOK` 是否配置正确
- 飞书机器人是否被移除

**解决**：
```bash
# 重新配置 Webhook
npx wrangler secret put FEISHU_WEBHOOK
```

### 4. AI 功能不工作

**检查**：
- `AI_API_KEY` 是否配置
- `AI_API_URL` 和 `AI_MODEL` 是否在 wrangler.json 中配置
- AI API 额度是否用完

**解决**：
```bash
# 检查配置
npx wrangler secret list

# 测试 AI 功能
curl -X POST https://你的-worker-地址.workers.dev/api/test/daily-report
```

### 5. 数据库查询失败

**检查**：
- D1 数据库是否创建
- 数据库迁移是否执行
- wrangler.json 中的 database_id 是否正确

**解决**：
```bash
# 查看数据库列表
npx wrangler d1 list

# 重新执行迁移
npx wrangler d1 execute au_gold_db --remote --file=migrations/0001_create_prices_table.sql
```

---

## 更新部署

### 更新后端

```bash
cd api
git pull
npm install
npx wrangler deploy
```

### 更新前端

**方式一：命令行**
```bash
cd web
git pull
npm install
npm run build
npx wrangler pages deploy dist --project-name=gold-monitor
```

**方式二：Git 自动部署**
```bash
git pull
git add .
git commit -m "Update"
git push origin main
```

Cloudflare Pages 会自动检测到更新并重新部署。

---

## 监控和日志

### 查看 Worker 日志

```bash
npx wrangler tail
```

### 在 Dashboard 查看日志

1. 进入 **Workers & Pages**
2. 选择你的 Worker
3. 点击 **Logs** 标签

### 查看 Pages 部署日志

1. 进入 **Workers & Pages**
2. 选择你的 Pages 项目
3. 点击 **Deployments** 标签
4. 选择一个部署查看详细日志

---

## 成本估算

### Cloudflare 免费额度

**Workers**：
- 100,000 请求/天
- 10ms CPU 时间/请求

**D1**：
- 5GB 存储
- 500 万行读取/天
- 10 万行写入/天

**KV**：
- 100,000 读取/天
- 1,000 写入/天
- 1GB 存储

**Pages**：
- 500 次构建/月
- 无限请求

### 本系统预估使用量

**每天**：
- Workers 请求：~2,000（定时任务 + API 调用）
- D1 读取：~10,000 行
- D1 写入：~1,500 行
- KV 读写：~100 次

**结论**：完全在免费额度内。

---

## 安全建议

1. **启用 Cloudflare Access**
   - 保护前端和 API 访问
   - 参考 [访问控制文档](./ACCESS_CONTROL.md)

2. **定期备份数据库**
   ```bash
   npx wrangler d1 export au_gold_db --remote --output=backup.sql
   ```

3. **监控 API 使用量**
   - 在 Dashboard 中查看使用统计
   - 设置告警阈值

4. **定期轮换密钥**
   - 定期更新 `FEISHU_WEBHOOK`
   - 定期更新 `AI_API_KEY`

---

## 相关文档

- [环境变量配置](./ENVIRONMENT.md)
- [访问控制](./ACCESS_CONTROL.md)
- [系统架构](./ARCHITECTURE.md)
- [后端 API](../api/README.md)
