# 金价监控系统 - 前端

基于 React + Vite + TypeScript 的金价监控前端应用，部署在 Cloudflare Pages。

## 技术栈

- **React** - UI 框架
- **Vite** - 构建工具
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lightweight Charts** - 图表库
- **Cloudflare Pages** - 静态网站托管

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 [http://localhost:5173](http://localhost:5173) 启动。

### 环境配置

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

**环境变量说明**：

- `VITE_USE_MOCK` - 是否使用 Mock API（仅开发环境有效）
  - `true` (默认) - 使用 Mock 数据，无需后端
  - `false` - 连接真实后端 API

**注意**：生产环境（`npm run build`）始终使用真实 API，不受此变量影响。

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist` 目录。

### 本地预览生产版本

```bash
npm run preview
```

### 部署到 Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name=gold-monitor
```

或通过 Cloudflare Dashboard 连接 Git 仓库自动部署。

## 项目结构

```
web/
├── src/
│   ├── react-app/          # React 应用入口
│   │   ├── App.tsx         # 主应用组件
│   │   ├── main.tsx        # 应用入口
│   │   └── index.css       # 全局样式
│   ├── components/         # UI 组件
│   │   ├── GoldChart.tsx   # 价格走势图
│   │   ├── TradeList.tsx   # 交易记录表格
│   │   ├── AlertList.tsx   # 告警记录表格
│   │   ├── ReportList.tsx  # AI 报告表格
│   │   ├── DailyPriceList.tsx  # 日线汇总表格
│   │   ├── TradeModal.tsx  # 交易记录弹窗
│   │   ├── TargetModal.tsx # 目标价设置弹窗
│   │   ├── TestModal.tsx   # 测试发送弹窗
│   │   └── ui.tsx          # 基础 UI 组件
│   ├── lib/
│   │   ├── api.ts          # API 调用封装
│   │   └── mockApi.ts      # Mock API 实现
│   └── types/
│       └── index.ts        # TypeScript 类型定义
├── public/                 # 静态资源
├── vite.config.ts         # Vite 配置
├── tailwind.config.js     # Tailwind 配置
└── tsconfig.json          # TypeScript 配置
```

## 功能特性

### 数据展示

- 实时金价卡片（当前价、24h最高/最低、振幅）
- 价格走势图（支持 6小时 - 30天）
- 日线汇总表格
- 交易记录表格（自动计算盈亏）
- 告警记录表格
- AI 分析报告表格

### 交互功能

- 点击图表记录交易
- 设置目标价和涨跌幅节点
- 时间范围选择器
- 测试发送功能（飞书/告警/AI报告）

### 样式设计

- 亮色主题
- 卡片式布局
- 响应式设计
- 中国股市配色（涨红跌绿）

## API 集成

前端通过 `/api/*` 路径调用后端 API：

- `GET /api/prices` - 查询价格数据
- `GET /api/daily-prices` - 查询日线汇总
- `GET /api/trades` - 查询交易记录
- `POST /api/trades` - 创建交易记录
- `GET /api/alerts` - 查询告警记录
- `GET /api/reports` - 查询 AI 报告
- `GET /api/targets` - 查询用户配置
- `POST /api/targets` - 创建/更新配置
- `POST /api/test/*` - 测试接口

详细 API 文档请参考 [后端 README](../api/README.md)。

## 开发说明

### Mock API vs 真实 API

**开发环境**：
- 默认使用 Mock API，无需启动后端
- 设置 `VITE_USE_MOCK=false` 可连接真实后端
- 需要同时启动后端：`cd ../api && npm run dev`

**生产环境**：
- 始终使用真实 API
- 前后端需要部署在同一域名下，或配置 CORS

### 修改 Mock 数据

编辑 `src/lib/mockApi.ts` 文件，调整模拟数据的生成逻辑。

### 添加新功能

1. 在 `src/types/index.ts` 定义类型
2. 在 `src/lib/api.ts` 添加 API 调用
3. 在 `src/lib/mockApi.ts` 添加 Mock 实现
4. 在 `src/components/` 创建组件
5. 在 `src/react-app/App.tsx` 集成

## 部署配置

### Cloudflare Pages 设置

**构建配置**：
- 构建命令：`npm run build`
- 构建输出目录：`dist`
- Node 版本：18 或更高

**环境变量**：
- 生产环境无需配置环境变量
- 前端通过相对路径 `/api` 调用后端

### 自定义域名

在 Cloudflare Pages 设置中添加自定义域名，确保与后端 Workers 在同一域名下。

## 故障排查

**问题：页面显示 Mock 数据**
- 检查是否在生产环境（`npm run build`）
- 检查 `src/lib/api.ts` 中的 `USE_MOCK` 逻辑

**问题：API 调用失败**
- 检查后端是否已部署
- 检查 CORS 配置
- 查看浏览器控制台错误信息

**问题：图表不显示**
- 检查是否有价格数据
- 查看浏览器控制台错误
- 确认 lightweight-charts 已正确安装

## 相关文档

- [系统架构](../doc/ARCHITECTURE.md)
- [后端 API](../api/README.md)
- [访问控制](../doc/ACCESS_CONTROL.md)
