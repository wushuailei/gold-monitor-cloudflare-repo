import {
  PricePoint,
  Trade as TradeType,
  Report,
  Alert,
  UserConfig,
  DailyPrice,
} from "../types";

export interface Trade extends TradeType {}

export interface GlobalConfig {
  id: number;
  symbol: string;
  rise_1?: number;
  rise_2?: number;
  rise_3?: number;
  fall_1?: number;
  fall_2?: number;
  fall_3?: number;
  market_status?: string;
  updated_ts: number;
}

export interface UserTarget {
  id: number;
  symbol: string;
  target_price: number;
  target_alert: number;
  target_cmp: string;
  created_ts: number;
  updated_ts: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const api = {
  async getPrices(hours: number = 24): Promise<PricePoint[]> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - hours * 3600;
    const res = await fetch(`${API_BASE}/prices?from=${from}&to=${now}`);
    if (!res.ok) throw new Error("Failed to fetch prices");
    return res.json();
  },

  async getDailyPrices(days: number = 7): Promise<DailyPrice[]> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - days * 86400;
    const res = await fetch(`${API_BASE}/daily-prices?from=${from}&to=${now}`);
    if (!res.ok) throw new Error("Failed to fetch daily prices");
    return res.json();
  },

  async getTrades(days: number = 7): Promise<Trade[]> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - days * 86400;
    const res = await fetch(`${API_BASE}/trades?from=${from}&to=${now}`);
    if (!res.ok) throw new Error("Failed to fetch trades");
    return res.json();
  },

  async createTrade(trade: Omit<Trade, "id">): Promise<void> {
    const res = await fetch(`${API_BASE}/trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade),
    });
    if (!res.ok) throw new Error("Failed to create trade");
  },

  async getReports(days: number = 7, limit = 50, offset = 0): Promise<Report[]> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - days * 86400;
    const res = await fetch(
      `${API_BASE}/reports?from=${from}&to=${now}&limit=${limit}&offset=${offset}`,
    );
    if (!res.ok) throw new Error("Failed to fetch reports");
    return res.json();
  },

  async getAlerts(days: number = 7): Promise<Alert[]> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - days * 86400;
    const res = await fetch(`${API_BASE}/alerts?from=${from}&to=${now}`);
    if (!res.ok) throw new Error("Failed to fetch alerts");
    return res.json();
  },

  async getTargets(): Promise<UserConfig[]> {
    const res = await fetch(`${API_BASE}/targets`);
    if (!res.ok) throw new Error("Failed to fetch targets");
    return res.json();
  },

  async createTarget(
    config: Omit<UserConfig, "id" | "created_ts">,
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to create target");
  },

  async deleteTarget(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/targets/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete target");
  },

  // 全局配置 API
  async getGlobalConfig(symbol: string = "AU"): Promise<GlobalConfig> {
    const res = await fetch(`${API_BASE}/global-config?symbol=${symbol}`);
    if (!res.ok) throw new Error("Failed to fetch global config");
    return res.json();
  },

  async updateGlobalConfig(config: Omit<GlobalConfig, "id" | "updated_ts">): Promise<void> {
    const res = await fetch(`${API_BASE}/global-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to update global config");
  },

  // 用户目标价 API
  async getUserTargets(symbol: string = "AU"): Promise<UserTarget[]> {
    const res = await fetch(`${API_BASE}/user-targets?symbol=${symbol}`);
    if (!res.ok) throw new Error("Failed to fetch user targets");
    return res.json();
  },

  async createUserTarget(target: { symbol: string; target_price: number; target_cmp: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/user-targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    });
    if (!res.ok) throw new Error("Failed to create user target");
  },

  async updateUserTarget(id: number, target: { target_price: number; target_cmp: string; target_alert: number }): Promise<void> {
    const res = await fetch(`${API_BASE}/user-targets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    });
    if (!res.ok) throw new Error("Failed to update user target");
  },

  async deleteUserTarget(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/user-targets/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete user target");
  },

  async testFeishu(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/test/feishu`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to test Feishu");
    }
    return res.json();
  },

  async testAlert(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/test/alert`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to test alert");
    }
    return res.json();
  },

  async testDailyReport(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/test/daily-report`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to test daily report");
    }
    return res.json();
  },

  // 持仓 API
  async getHoldings(symbol: string = "AU"): Promise<{
    symbol: string;
    total_qty: number;
    total_cost: number;
    avg_price: number;
    realized_profit: number;
    updated_ts: number;
  }> {
    const res = await fetch(`${API_BASE}/holdings?symbol=${symbol}`);
    if (!res.ok) throw new Error("Failed to fetch holdings");
    return res.json();
  },
};
