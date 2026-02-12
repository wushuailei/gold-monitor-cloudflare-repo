# 访问控制配置指南

## 概述

本系统使用 **Cloudflare Access（Zero Trust）** 进行访问控制，通过邮箱一次性验证码（OTP）实现身份验证。

**优点**：
- 无需实现自定义登录系统
- 边缘层面拦截未授权请求
- 支持多种身份验证方式
- 免费计划支持最多 50 个用户

## 配置步骤

### 1. 启用 Cloudflare Zero Trust

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Zero Trust** 面板（如果没有，点击左侧菜单创建）
3. 选择一个团队名称（例如：`gold-monitor-team`）

### 2. 配置身份验证方式

1. 进入 **Settings** → **Authentication**
2. 点击 **Add new** 添加登录方式
3. 选择 **One-time PIN**（一次性验证码）
4. 启用并保存

### 3. 创建 Access 应用

需要创建两个应用，分别保护前端和 API：

#### 3.1 创建前端应用

1. 进入 **Access** → **Applications**
2. 点击 **Add an application**
3. 选择 **Self-hosted**

**前端应用配置**：
```
Application name: Gold Price Monitor - Web
Session Duration: 24 hours
Application domain: 
  - Type: Subdomain
  - Subdomain: gold-monitor (或你的自定义域名)
  - Domain: your-domain.com
  - Path: (留空，保护整个域名)
```

#### 3.2 创建 API 应用

1. 再次点击 **Add an application**
2. 选择 **Self-hosted**

**API 应用配置**：
```
Application name: Gold Price Monitor - API
Session Duration: 24 hours
Application domain: 
  - Type: Subdomain
  - Subdomain: gold-api (或你的 API 域名)
  - Domain: your-domain.com
  - Path: /api (只保护 /api 路径)
```

或者如果 API 和前端在同一域名下：
```
Application domain: 
  - Type: Subdomain
  - Subdomain: gold-monitor
  - Domain: your-domain.com
  - Path: /api/*
```

### 4. 配置访问策略

为**两个应用**配置相同的访问策略：

**Policy 1: 允许特定邮箱访问**
```
Policy name: Allowed Users
Action: Allow
Session duration: 24 hours

Include rules:
  - Selector: Emails
  - Value: user1@example.com, user2@example.com
```

或者使用邮箱域名：
```
Include rules:
  - Selector: Emails ending in
  - Value: @your-company.com
```

**重要**：前端和 API 应用必须使用相同的策略，这样用户登录前端后，浏览器会自动携带 Access Cookie 访问 API。

### 5. 部署应用并配置域名

#### 5.1 部署前端（Pages）

```bash
cd web
npm install
npm run build
npx wrangler pages deploy dist --project-name=gold-monitor
```

部署后，在 Cloudflare Pages 设置中：
1. 进入 **Custom domains**
2. 添加自定义域名：`gold-monitor.your-domain.com`
3. Cloudflare 会自动配置 DNS

#### 5.2 部署后端（Workers）

```bash
cd api
npm install
npx wrangler deploy
```

部署后，配置 Workers 路由：

**方案 A：使用子域名（推荐）**
1. 在 Workers 设置中添加自定义域名：`gold-api.your-domain.com`
2. 在前端 API 配置中使用：`https://gold-api.your-domain.com`

**方案 B：使用同一域名的路径**
1. 在 Workers 设置中添加路由：`gold-monitor.your-domain.com/api/*`
2. 前端 API 配置使用相对路径：`/api`

#### 5.3 配置环境变量

在 Workers 设置中添加环境变量：

```bash
# 使用 wrangler 命令设置
npx wrangler secret put FEISHU_WEBHOOK
npx wrangler secret put AI_API_KEY

# 或在 Cloudflare Dashboard 中设置
# Workers & Pages → 你的 Worker → Settings → Variables
```

添加 CORS_ORIGIN（如果使用方案 A）：
```
CORS_ORIGIN=https://gold-monitor.your-domain.com
```

### 6. 测试访问

1. 访问你的应用域名（例如：`https://gold-monitor.your-domain.com`）
2. 系统会重定向到 Cloudflare Access 登录页
3. 输入允许的邮箱地址
4. 检查邮箱收到的验证码（6位数字）
5. 输入验证码完成登录
6. 登录成功后，前端会自动加载，API 请求也会自动通过验证

**验证 API 保护**：
- 在浏览器中直接访问 API 地址（如 `https://gold-api.your-domain.com/api/prices`）
- 应该会被重定向到 Access 登录页
- 这说明 API 已被正确保护

## 工作原理

### Cloudflare Access 流程

1. **用户访问前端** → Access 要求登录 → 输入邮箱验证码
2. **登录成功** → 浏览器获得 Access Cookie（`CF_Authorization`）
3. **前端发起 API 请求** → 浏览器自动携带 Cookie
4. **API 的 Access 应用验证 Cookie** → 允许请求通过
5. **未登录用户直接访问 API** → 被 Access 拦截

**无需修改代码**，Cloudflare 在边缘自动处理所有验证逻辑。

### 定时任务不受影响

- Worker 的 `scheduled()` 函数不走 HTTP
- 不经过 Access 验证
- 正常每分钟运行

## 域名配置示例

### 示例 1：使用子域名（推荐）

```
前端: https://gold.your-domain.com
API:  https://gold-api.your-domain.com

Access 应用 1 (前端):
  - Domain: gold.your-domain.com
  - Path: (留空)

Access 应用 2 (API):
  - Domain: gold-api.your-domain.com
  - Path: (留空)

环境变量:
  CORS_ORIGIN=https://gold.your-domain.com
```

### 示例 2：使用同一域名的路径

```
前端: https://gold.your-domain.com
API:  https://gold.your-domain.com/api

Access 应用 1 (前端):
  - Domain: gold.your-domain.com
  - Path: (留空，保护整个域名)

Workers 路由:
  - Route: gold.your-domain.com/api/*
  - Worker: gold-price-monitor-api

环境变量:
  CORS_ORIGIN=https://gold.your-domain.com
```

**注意**：使用示例 2 时，前端和 API 共享同一个 Access 应用，配置更简单。

## 用户管理

### 添加新用户

1. 进入 **Access** → **Applications** → 选择你的应用
2. 编辑 Policy
3. 在 **Emails** 中添加新用户邮箱

### 移除用户

1. 从 Policy 的 **Emails** 列表中删除对应邮箱
2. 用户的现有会话会在过期后失效

## 高级配置

### 多因素认证（可选）

如果需要更高安全性，可以添加额外的认证方式：

1. 进入 **Settings** → **Authentication**
2. 添加其他登录方式：
   - GitHub
   - Google
   - Microsoft Azure AD
   - SAML

### 会话管理

在应用配置中可以设置：
- **Session Duration**: 会话持续时间（建议 24 小时）
- **Idle timeout**: 空闲超时时间
- **Require re-authentication**: 是否需要重新认证

## 注意事项

1. **免费额度**：Cloudflare Zero Trust 免费计划支持最多 50 个用户
2. **邮箱验证**：确保用户能收到来自 Cloudflare 的验证邮件（检查垃圾邮件）
3. **会话持久化**：用户登录后会话会保存在浏览器中，24 小时内无需重复登录
4. **API 保护**：Access 会自动保护前端和 API，无需额外配置
5. **本地开发**：本地开发时可以绕过 Access，使用 `wrangler dev` 直接访问

## 故障排查

### 问题：无法收到验证码
- 检查邮箱地址是否正确
- 查看垃圾邮件文件夹
- 确认 One-time PIN 已启用

### 问题：登录后立即退出
- 检查 Session Duration 配置
- 清除浏览器 Cookie 重试
- 检查应用域名配置是否正确

### 问题：API 请求被拦截
- 确认 CORS_ORIGIN 配置正确
- 检查 API 路由是否在 Access 保护范围内
- 查看浏览器控制台的错误信息

## 参考文档

- [Cloudflare Zero Trust 文档](https://developers.cloudflare.com/cloudflare-one/)
- [Access 应用配置](https://developers.cloudflare.com/cloudflare-one/applications/)
- [身份验证方式](https://developers.cloudflare.com/cloudflare-one/identity/)
