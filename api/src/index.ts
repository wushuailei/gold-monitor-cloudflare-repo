import type { Env } from "./types";
import { handleScheduled } from "./scheduled";
import { handleOptions, errorResponse } from "./utils/cors";
import { handleGetPrices } from "./routes/prices";
import { handleGetDailyPrices } from "./routes/dailyPrices";
import { handleGetTrades, handlePostTrade } from "./routes/trades";
import { handleGetReports } from "./routes/reports";
import { handleGetAlerts } from "./routes/alerts";
import {
  handleGetTargets,
  handlePostTarget,
  handleDeleteTarget,
} from "./routes/targets";
import { handleTestFeishu, handleTestDailyReport, handleTestAlert } from "./routes/test";

export default {
  /**
   * HTTP 请求入口 — API 路由分发
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = env.CORS_ORIGIN;

    // CORS 预检
    if (method === "OPTIONS") {
      return handleOptions(origin);
    }

    // 路由分发
    if (path === "/api/prices" && method === "GET") {
      return handleGetPrices(request, env, origin);
    }

    if (path === "/api/daily-prices" && method === "GET") {
      return handleGetDailyPrices(request, env, origin);
    }

    if (path === "/api/trades") {
      if (method === "GET") return handleGetTrades(request, env, origin);
      if (method === "POST") return handlePostTrade(request, env, origin);
    }

    if (path === "/api/reports" && method === "GET") {
      return handleGetReports(request, env, origin);
    }

    if (path === "/api/alerts" && method === "GET") {
      return handleGetAlerts(request, env, origin);
    }

    if (path === "/api/targets") {
      if (method === "GET") return handleGetTargets(request, env, origin);
      if (method === "POST") return handlePostTarget(request, env, origin);
    }

    // DELETE /api/targets/:id
    const targetMatch = path.match(/^\/api\/targets\/(\d+)$/);
    if (targetMatch && method === "DELETE") {
      return handleDeleteTarget(targetMatch[1], env, origin);
    }

    // 测试接口
    if (path === "/api/test/feishu" && method === "POST") {
      return handleTestFeishu(request, env, origin);
    }

    if (path === "/api/test/alert" && method === "POST") {
      return handleTestAlert(request, env, origin);
    }

    if (path === "/api/test/daily-report" && method === "POST") {
      return handleTestDailyReport(request, env, origin);
    }

    return errorResponse("Not Found", origin, 404);
  },

  /**
   * 定时任务入口（每分钟执行）
   */
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(handleScheduled(env, ctx));
  },
} satisfies ExportedHandler<Env>;
