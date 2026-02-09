## 🌍 1) 国际/全球黄金价格 API（现货/实时）

### **GoldAPI (goldapi.net)**

* 提供实时 & 历史贵金属价格（黄金、白银、铂金等）
* 支持多货币和不同单位
* REST API，开发者易用
  👉 适合获取全球黄金现货价格做实时监控。 ([goldapi.net][1])

---

### **GoldAPI.io**

* 免费版提供实时 XAU 价格数据
* 输出 JSON，CORS 支持
* 可直接在前端调用
  👉 很适合快速做实时展示。 ([goldapi.io][2])

---

### **Metals.Dev API**

* 实时贵金属价格，包括黄金
* 包含丰富的数据点 + 多货币支持
  👉 如果你想要更全面的市场指标也不错。 ([市场主机][3])

---

### **MetalpriceAPI**

* 实时 & 历史贵金属 + 外汇行情数据
* 支持黄金现货价格
  👉 也是开发者常用的基础行情 API。 ([metalpriceapi.com][4])

---

## 🇨🇳 2) 国内/本地化行情 & 第三方聚合 API

### **极速数据 / 互联 API（金价行情）**

* 聚合了上海黄金交易所、伦敦金、香港贵金属等行情
* 可返回多种黄金价格数据
  👉 适合国内开发者集成国内行情。 ([jisuapi.com][5])

---

### **免费每日实时金价 API（FreeJK）**

* 无认证即可直接获取黄金现货价格及历史
* 数据包含国内&国际行情展示
  👉 最简单免 key 的轻量入门数据。 ([freejk.com][6])

---

### **NowAPI 融合金价行情**

* 包含 SH 黄金、国际金价等整合数据
* 需要 appkey/sign 等参数
  👉 可合并多来源作为备用行情方案。 ([nowapi.com][7])

---

## 📊 3) 综合数据市场服务（付费 & 企业级）

### **Aliyun/腾讯云/聚合数据行情 API**

* 包括黄金现货/期货等多种行情
* 通常稳定、可商用
  👉 适合升级到企业级服务后使用。 ([developer.aliyun.com][8])

---

## 🧠 使用建议（按稳定性 & 成本）

### ⚡ 初期 MVP（免费 & 开发快）

* **GoldAPI.io / FreeJK / 公共免费 API**
  适合快速部署，不用复杂授权。

### 📈 稳定 + 高可靠（量化/监控）

* **GoldAPI (goldapi.net)** 或 **Metals.Dev / MetalpriceAPI**
  需要 API key，但更可靠且数据精度高。

### 📊 国内行情优先

* **极速数据/互联 API** 或 **聚合数据**
  如果你侧重国内交易所行情，可优先接入。

---

## 🧩 实践集成提示

✅ API Key & 限流
大多数付费/第三方 API 都需要注册拿 API Key，并注意请求频率（限制每分钟多少次）— 这对于你每分钟抓价要设计节流逻辑。

✅ 数据格式统一
不同 API 可能返回的字段名称不一致，建议抽象一层统一数据结构（`{ ts, price }`）处理，方便存 D1。

✅ 备用/兜底数据源
建议同时接入两家数据源（一个主要、一个备用），如果主源失败就回退。

---

## 📌 小结（按优先级）

| 方案                | 是否需 Key | 可用频率 | 国内行情 |
| ----------------- | ------- | ---- | ---- |
| **GoldAPI.io**    | 否/可选    | 中等   | ✖    |
| **FreeJK API**    | 否       | 普通   | ✔    |
| **Goldapi.net**   | 是       | 高    | ✖    |
| **Metals.Dev**    | 是       | 高    | ✖    |
| **极速数据 / 互联 API** | 是       | 中等   | ✔    |
| **NowAPI 融合行情**   | 是       | 中等   | ✔    |
| **企业云市场 API**     | 是/付费    | 高    | ✔    |

---

如你后续要接入**具体某个 API 的抓价实现示例代码（例如 Worker 如何抓 GoldAPI 或 国内 API）**，我也可以直接给你一个可运行的 TS 代码片段，你想让我按“免费版先写”还是“付费更稳定版先写”？

[1]: https://goldapi.net/?utm_source=chatgpt.com "Real-time Gold, Silver & Precious Metals Data API - goldapi.net"
[2]: https://www.goldapi.io/?utm_source=chatgpt.com "Free Real-Time Gold and Silver Spot Prices REST JSON API | GoldAPI.io"
[3]: https://www.marketshost.com/gold-price/api/?utm_source=chatgpt.com "Metals.dev API Data - 204 Real-Time Data Points | Gold Price API ..."
[4]: https://metalpriceapi.com/gold?utm_source=chatgpt.com "MetalpriceAPI | Free Live Gold Price API"
[5]: https://www.jisuapi.com/api/gold/?utm_source=chatgpt.com "黄金价格API接口_实时金价_国际黄金价格数据_免费数据接口 ..."
[6]: https://freejk.com/api/47?utm_source=chatgpt.com "每日实时金价接口免费使用 - FreeJK免费API"
[7]: https://www.nowapi.com/api/finance.csgold?utm_source=chatgpt.com "融合金价行情 - 数据接口 - NowAPI"
[8]: https://developer.aliyun.com/article/1680206?utm_source=chatgpt.com "黄金数据查询API—多源行情数据整合实践指南"
