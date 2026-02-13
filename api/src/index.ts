import type { Env } from "./types";
import { handleScheduled } from "./scheduled";
import { handleOptions, errorResponse } from "./utils/cors";
import { handleGetPrices } from "./routes/prices";
import { handleGetDailyPrices } from "./routes/dailyPrices";
import { handleGetTrades, handlePostTrade } from "./routes/trades";
import { handleGetHoldings } from "./routes/holdings";
import { handleGetReports } from "./routes/reports";
import { handleGetAlerts } from "./routes/alerts";
import {
  handleGetTargets,
  handlePostTarget,
  handleDeleteTarget,
} from "./routes/targets";
import { handleGetGlobalConfig, handlePostGlobalConfig } from "./routes/globalConfig";
import {
  handleGetUserTargets,
  handlePostUserTarget,
  handleDeleteUserTarget,
  handlePutUserTarget,
} from "./routes/userTargets";
import { handleTestFeishu, handleTestDailyReport, handleTestAlert } from "./routes/test";

export default {
  /**
   * HTTP 请求入口 — API 路由分发
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = env.CORS_ORIGIN;

    if (env.REQUIRE_REFERER === "true") {
      const referer = request.headers.get("Referer");
      const allowedOrigins = env.ALLOWED_ORIGINS?.split(",") || [];
      
      // 如果没有 Referer 头，直接拒绝
      if (!referer) {
        return errorResponse("Forbidden: Missing referer", origin, 403);
      }
      
      // 验证 Referer 是否在允许列表中
      const refererOrigin = new URL(referer).origin;
      const isAllowed = allowedOrigins.some(allowed => refererOrigin.includes(allowed));
      
      if (!isAllowed && allowedOrigins.length > 0) {
        return errorResponse("Forbidden: Invalid referer", origin, 403);
      }
    }

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

    if (path === "/api/holdings" && method === "GET") {
      return handleGetHoldings(request, env, origin);
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

    // 全局配置 API
    if (path === "/api/global-config") {
      if (method === "GET") return handleGetGlobalConfig(request, env, origin);
      if (method === "POST") return handlePostGlobalConfig(request, env, origin);
    }

    // 用户目标价 API
    if (path === "/api/user-targets") {
      if (method === "GET") return handleGetUserTargets(request, env, origin);
      if (method === "POST") return handlePostUserTarget(request, env, origin);
    }

    // PUT /api/user-targets/:id
    // DELETE /api/user-targets/:id
    const userTargetMatch = path.match(/^\/api\/user-targets\/(\d+)$/);
    if (userTargetMatch) {
      if (method === "PUT") return handlePutUserTarget(userTargetMatch[1], request, env, origin);
      if (method === "DELETE") return handleDeleteUserTarget(userTargetMatch[1], env, origin);
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
