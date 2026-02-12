import {
  PricePoint,
  Trade as TradeType,
  Report,
  Alert,
  UserConfig,
  DailyPrice,
} from "../types";
import { mockApi } from "./mockApi";

// Re-export Trade to reuse the interface name if needed, or just use TradeType internally
// But to match the previous file content perfectly regarding the types used:
export interface Trade extends TradeType {}

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// 自动判断：开发环境使用 Mock，生产环境使用真实 API
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== "false";

const realApi = {
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
};

export const api = USE_MOCK ? mockApi : realApi;
