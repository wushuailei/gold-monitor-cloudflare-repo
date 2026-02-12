import { PricePoint, Trade, Report, Alert, UserConfig, DailyPrice } from "../types";

// Helper to generate some fake price history
const generatePriceHistory = (hours: number): PricePoint[] => {
  const points: PricePoint[] = [];
  const now = Math.floor(Date.now() / 1000);
  let price = 580.0; // Starting fake price (国内金价)

  for (let i = hours * 60; i >= 0; i -= 5) { // 每5分钟一个点
    // Random walk
    const change = (Math.random() - 0.5) * 0.5;
    price += change;
    points.push({
      id: i,
      symbol: 'AU9999',
      ts: now - i * 60,
      price: parseFloat(price.toFixed(2)),
      xau_price: parseFloat((price * 31.1035 / 7.2).toFixed(2)), // 模拟国际金价
    });
  }
  return points;
};

const generateDailyPrices = (days: number): DailyPrice[] => {
  const dailyPrices: DailyPrice[] = [];
  const now = Math.floor(Date.now() / 1000);
  let basePrice = 580.0;

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - i * 86400;
    const dayStartAligned = Math.floor(dayStart / 86400) * 86400;
    
    basePrice += (Math.random() - 0.5) * 2;
    const maxPrice = basePrice + Math.random() * 3;
    const minPrice = basePrice - Math.random() * 3;
    
    dailyPrices.push({
      id: days - i,
      symbol: 'AU9999',
      day_ts: dayStartAligned,
      max_price: parseFloat(maxPrice.toFixed(2)),
      min_price: parseFloat(minPrice.toFixed(2)),
      max_ts: dayStartAligned + Math.floor(Math.random() * 86400),
      min_ts: dayStartAligned + Math.floor(Math.random() * 86400),
      last_updated: now,
    });
  }
  return dailyPrices;
};

export const mockApi = {
  async getPrices(hours: number = 24): Promise<PricePoint[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generatePriceHistory(hours));
      }, 500); // Simulate network delay
    });
  },

  async getDailyPrices(days: number = 7): Promise<DailyPrice[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateDailyPrices(days));
      }, 500);
    });
  },

  async getTrades(days: number = 7): Promise<Trade[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Math.floor(Date.now() / 1000);
        resolve([
          {
            id: 1,
            ts: now - 5 * 86400,
            symbol: 'AU9999',
            side: "买",
            price: 575.5,
            qty: 10,
            note: "测试买入",
          },
          {
            id: 2,
            ts: now - 2 * 86400,
            symbol: 'AU9999',
            side: "卖",
            price: 582.0,
            qty: 5,
            note: "部分止盈",
          },
        ]);
      }, 300);
    });
  },

  async createTrade(trade: Omit<Trade, "id">): Promise<void> {
    console.log("Mock createTrade:", trade);
    return new Promise((resolve) => setTimeout(resolve, 300));
  },

  async getReports(days: number = 7, limit = 50, offset = 0): Promise<Report[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Math.floor(Date.now() / 1000);
        resolve([
          {
            id: 1,
            ts: now - 3600,
            symbol: "AU9999",
            price: 580.5,
            model: "gpt-4o-mini",
            report_md:
              "## 市场分析\n\n国内金价在 ¥580 附近震荡整理。技术指标显示短期可能突破 ¥585 阻力位。\n\n- **支撑位**: ¥575\n- **阻力位**: ¥585",
          },
          {
            id: 2,
            ts: now - 86400,
            symbol: "AU9999",
            price: 578.5,
            model: "gpt-4o-mini",
            report_md:
              "## 每日总结\n\n盘整阶段持续。市场等待关键经济数据。",
          },
        ]);
      }, 400);
    });
  },

  async getAlerts(days: number = 7): Promise<Alert[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Math.floor(Date.now() / 1000);
        resolve([
          {
            id: 1,
            ts: now - 900,
            symbol: "AU9999",
            created_by: "default_user",
            alert_type: "RISE",
            base_type: "YESTERDAY",
            node_level: 1,
            price: 582.0,
            ref_price: 578.0,
            change_percent: 0.69,
          },
          {
            id: 2,
            ts: now - 3600,
            symbol: "AU9999",
            created_by: "default_user",
            alert_type: "TARGET",
            base_type: "TARGET",
            node_level: 0,
            price: 580.5,
            ref_price: 580.0,
            change_percent: 0.08,
          },
        ]);
      }, 300);
    });
  },

  async getTargets(): Promise<UserConfig[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Math.floor(Date.now() / 1000);
        resolve([
          {
            id: 1,
            symbol: 'AU9999',
            created_by: 'default_user',
            target_price: 590.0,
            target_alert: 1,
            target_cmp: 'GTE',
            rise_1: 1.0,
            rise_2: 2.0,
            rise_3: 3.0,
            fall_1: 1.0,
            fall_2: 2.0,
            fall_3: 3.0,
            created_ts: now - 86400,
          },
        ]);
      }, 300);
    });
  },

  async createTarget(
    config: Omit<UserConfig, "id" | "created_ts">,
  ): Promise<void> {
    console.log("Mock createTarget:", config);
    return new Promise((resolve) => setTimeout(resolve, 300));
  },

  async deleteTarget(id: number): Promise<void> {
    console.log("Mock deleteTarget:", id);
    return new Promise((resolve) => setTimeout(resolve, 300));
  },

  async testFeishu(): Promise<{ success: boolean; message: string }> {
    console.log("Mock testFeishu");
    return new Promise((resolve) => 
      setTimeout(() => resolve({ 
        success: true, 
        message: "Mock: 测试消息已发送到飞书群" 
      }), 500)
    );
  },

  async testAlert(): Promise<{ success: boolean; message: string }> {
    console.log("Mock testAlert");
    return new Promise((resolve) => 
      setTimeout(() => resolve({ 
        success: true, 
        message: "Mock: 测试告警消息已发送到飞书群" 
      }), 500)
    );
  },

  async testDailyReport(): Promise<{ success: boolean; message: string }> {
    console.log("Mock testDailyReport");
    return new Promise((resolve) => 
      setTimeout(() => resolve({ 
        success: true, 
        message: "Mock: AI 分析报告已生成并发送到飞书群" 
      }), 1000)
    );
  },
};
