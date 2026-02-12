# 金价监控系统（AU9999）

基于 Cloudflare 全家桶的金价实时监控系统，支持智能告警、AI 分析和交易记录管理。

**技术栈**：Workers + D1 + Pages  
**采样频率**：1 分钟  
**告警渠道**：飞书群机器人

---

## 快速开始

```bash
# 本地开发
cd api && npm install && npm run dev
cd web && npm install && npm run dev

# 部署
cd api && npx wrangler deploy
cd web && npm run build && npx wrangler pages deploy dist
```

详细部署步骤请参考 [部署指南](./doc/DEPLOYMENT.md)。

---

## 核心功能

- 实时金价监控（每分钟采样）
- 智能告警系统（涨跌幅 + 目标价）
- AI 市场分析（CRIT 级别触发）
- 交易记录管理（自动计算盈亏）
- 数据分析（日线汇总，最多保留 360 天）

---

## 文档导航

- [部署指南](./doc/DEPLOYMENT.md) - 完整的部署步骤和 Cloudflare 配置
- [系统架构](./doc/ARCHITECTURE.md) - 整体架构和技术栈
- [数据库设计](./doc/DATABASE.md) - D1 表结构和索引
- [定时任务](./doc/SCHEDULED_TASKS.md) - Cron 任务和告警引擎
- [前端开发](./doc/FRONTEND.md) - 前端功能和 API
- [环境变量配置](./doc/ENVIRONMENT.md) - 完整的环境变量配置指南
- [访问控制](./doc/ACCESS_CONTROL.md) - Cloudflare Access 配置
- [后端 API](./api/README.md) - 完整 API 接口文档

---

## 环境变量

详细配置请参考 [环境变量配置文档](./doc/ENVIRONMENT.md)。

**快速配置**：

```bash
# 后端必填
cd api
npx wrangler secret put FEISHU_WEBHOOK

# 后端可选（AI 功能）
npx wrangler secret put AI_API_KEY
```

在 `api/wrangler.json` 中配置：
```json
{
  "vars": {
    "AI_API_URL": "https://api.openai.com/v1/chat/completions",
    "AI_MODEL": "gpt-4o-mini"
  }
}
```

---

## 常见问题

**如何添加新用户？**  
参考 [访问控制文档](./doc/ACCESS_CONTROL.md#用户管理)

**如何修改告警阈值？**  
前端界面点击"设置目标价"按钮配置

**数据保留多久？**  
系统自动保留最近 360 天数据，每天凌晨清理

**本地开发如何绕过 Access？**  
使用 `wrangler dev` 命令自动绕过

---

## 许可证

MIT License
