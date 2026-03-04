# 前端开发指南

## 技术栈

- React + TypeScript
- Vite
- TailwindCSS
- Lightweight Charts（图表库）
- date-fns（日期处理）

## 页面结构

### 主界面布局

```
┌─────────────────────────────────────────┐
│ Header（标题 + 刷新 + 设置目标价）       │
├─────────────────────────────────────────┤
│ 价格卡片（当前价、涨跌幅、昨日数据）     │
├─────────────────────────────────────────┤
│ 统计卡片（持仓、盈亏、告警统计）         │
├─────────────────────────────────────────┤
│ 价格走势图（可点击标注买卖点）           │
├─────────────────────────────────────────┤
│ 日线汇总表格（开盘/收盘/最高/最低）      │
├─────────────────────────────────────────┤
│ 告警记录表格                            │
├─────────────────────────────────────────┤
│ 关口记录表格                            │
├─────────────────────────────────────────┤
│ 交易记录表格（含收益统计）               │
├─────────────────────────────────────────┤
│ AI 分析报告表格                         │
├─────────────────────────────────────────┤
│ 目标价管理                              │
├─────────────────────────────────────────┤
│ 全局配置显示                            │
└─────────────────────────────────────────┘
```

## 核心功能

### 1. 价格走势图

**特性**：
- 显示分钟线数据（默认 24 小时）
- 支持时间范围切换（6h/12h/24h/3d/7d/15d/30d）
- 点击图表可标注买卖点
- 显示交易标记（买入绿色↑，卖出红色↓）
- 显示目标价线（虚线）

**交互**：
- 点击图表 → 弹出交易记录弹窗
- 自动填充时间和价格
- 选择买入/卖出，填写克价、克重和备注

### 2. 价格卡片

显示实时数据：
- 当前价格 + 涨跌幅
- 昨日最高价
- 昨日最低价
- 昨日开盘价
- 昨日收盘价

### 3. 统计卡片

**持仓信息卡片**：
- 持仓克重
- 持仓克均价
- 持仓成本（前端计算：克重 × 克均价）
- 持仓市值（前端计算：克重 × 当前价）
- 持仓收益（市值 - 成本）

**交易统计卡片**：
- 已实现收益
- 今日告警数
- 总告警数

### 4. 日线汇总表格

显示每日数据：
- 日期
- 品种（AU）
- 开盘价（北京时间 9:00）
- 收盘价（北京时间 23:55）
- 最高价（时间）
- 最低价（时间）
- 振幅

**特性**：
- 支持时间范围选择（1d/3d/7d/15d/30d/90d/180d/360d）
- 最大高度 400px，超出可滚动
- 表头固定

### 5. 告警记录表格

显示告警历史：
- 时间
- 类型（目标价/涨幅/跌幅）
- 对比基准（昨日收盘/买入价）
- 当前价格
- 基准价格
- 涨跌幅

**颜色规则**：
- 涨幅：红色
- 跌幅：绿色

### 6. 关口记录表格

显示整数关口跨越记录：
- 时间
- 关口价格（如 1100、1110）
- 方向（突破/跌破）
- 当时价格
- 状态（已发送/失败）

**特性**：
- 突破显示红色向上箭头
- 跌破显示绿色向下箭头
- 支持时间范围选择

### 7. 交易记录表格

显示交易历史：
- 时间
- 类型（买入/卖出）
- 品种
- 克价
- 克重
- 金额（自动计算）
- 备注

**收益统计**：
- 持仓克重和克均价
- 持仓成本
- 持仓市值
- 持仓收益
- 已实现收益

### 8. AI 分析报告

显示 AI 生成的市场分析：
- 时间
- 品种
- 模型
- 价格
- 报告摘要
- 查看详情按钮

点击查看按钮弹出完整报告（Markdown 格式）。

### 9. 目标价管理

**目标价列表**：
- 目标价格
- 触发条件（≥/≤/=）
- 提醒状态（开启/关闭）
- 已提醒次数（最多 3 次）
- 操作（编辑/删除）

**添加/编辑目标价弹窗**：
- 目标价格输入
- 触发条件选择（≥/≤/=）
- 是否启用提醒

### 10. 全局配置显示

显示全局告警节点配置：
- 涨幅节点（一/二/三级）
- 跌幅节点（一/二/三级）
- 市场状态
- 最后更新时间

## 时间范围选择

所有表格和图表都支持独立的时间范围选择：

**价格走势图**：6h/12h/24h/3d/7d/15d/30d  
**日线汇总**：1d/3d/7d/15d/30d/90d/180d/360d  
**告警记录**：1d/3d/7d/15d/30d/90d/180d/360d  
**关口记录**：1d/3d/7d/15d/30d/90d/180d/360d  
**交易记录**：1d/3d/7d/15d/30d/90d/180d/360d  
**AI 报告**：1d/3d/7d/15d/30d/90d/180d/360d

## 颜色规范

### 涨跌颜色（中国习惯）
- 涨：红色（#DC2626）
- 跌：绿色（#16A34A）

### 交易类型颜色
- 买入：绿色背景 + 绿色图标
- 卖出：红色背景 + 红色图标

### 告警类型颜色
- 目标价：蓝色
- 涨幅：红色
- 跌幅：绿色

### 关口方向颜色
- 突破：红色
- 跌破：绿色

### 盈亏颜色
- 盈利：红色
- 亏损：绿色

## API 调用

### 查询接口

```typescript
// 获取价格数据（小时）
api.getPrices(hours: number)

// 获取日线汇总（天）
api.getDailyPrices(days: number)

// 获取交易记录（天）
api.getTrades(days: number)

// 获取告警记录（天）
api.getAlerts(days: number)

// 获取关口记录（天）
api.getPriceLevels(days: number)

// 获取 AI 报告（天）
api.getReports(days: number)

// 获取用户目标价
api.getUserTargets()

// 获取持仓信息
api.getHoldings()

// 获取全局配置
api.getGlobalConfig()
```

### 写入接口

```typescript
// 创建交易记录
api.createTrade({
  ts: number,
  symbol: string,
  side: '买' | '卖',
  price: number,    // 克价
  qty: number,      // 克重
  note?: string
})

// 创建用户目标价
api.createUserTarget({
  symbol: string,
  target_price: number,
  target_cmp: 'EQ' | 'GTE' | 'LTE'
})

// 更新用户目标价
api.updateUserTarget(id: number, {
  target_price: number,
  target_cmp: 'EQ' | 'GTE' | 'LTE',
  target_alert: 0 | 1
})

// 删除用户目标价
api.deleteUserTarget(id: number)

// 更新全局配置
api.updateGlobalConfig({
  symbol: string,
  rise_1?: number,
  rise_2?: number,
  rise_3?: number,
  fall_1?: number,
  fall_2?: number,
  fall_3?: number
})
```

## 数据类型定义

### Price（价格数据）
```typescript
interface Price {
  ts: number;        // 时间戳（秒）
  price: number;     // 国内金价（元/克）
  xau_price: number; // 国际金价（美元/盎司）
}
```

### DailyPrice（日线数据）
```typescript
interface DailyPrice {
  day_ts: number;      // 当日0点时间戳
  open_price?: number; // 开盘价
  open_ts?: number;    // 开盘时间
  close_price?: number; // 收盘价
  close_ts?: number;   // 收盘时间
  max_price: number;   // 最高价
  min_price: number;   // 最低价
  max_ts: number;      // 最高价时间
  min_ts: number;      // 最低价时间
}
```

### Trade（交易记录）
```typescript
interface Trade {
  id: number;
  ts: number;        // 时间戳
  symbol: string;    // 品种
  side: string;      // 方向（买/卖）
  price: number;     // 克价
  qty: number;       // 克重
  note?: string;     // 备注
}
```

### PriceLevel（关口记录）
```typescript
interface PriceLevel {
  id: number;
  ts: number;          // 时间戳
  symbol: string;      // 品种
  price_level: number; // 关口价格
  direction: string;   // 方向（UP/DOWN）
  price: number;       // 当时价格
  status?: string;     // 状态
}
```

### Holdings（持仓信息）
```typescript
interface Holdings {
  symbol: string;
  total_qty: number;       // 总克数
  avg_price: number;       // 平均克价
  realized_profit: number; // 已实现盈亏
  updated_ts: number;      // 更新时间
}
```

### UserTarget（用户目标价）
```typescript
interface UserTarget {
  id: number;
  symbol: string;
  target_price: number;    // 目标价
  target_alert: number;    // 是否启用（0/1）
  target_cmp: string;      // 比较方式
  alert_count: number;     // 已提醒次数
  created_ts: number;
  updated_ts: number;
}
```

## 响应式设计

- 桌面端：多列布局
- 平板：2列布局
- 手机：单列布局
- 表格：横向滚动

## 性能优化

- 使用 React.memo 避免不必要的重渲染
- 图表数据按需加载
- 表格虚拟滚动（大数据量时）
- API 请求去重和缓存
