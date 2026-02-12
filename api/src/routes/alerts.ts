import type { Env } from "../types";
import { jsonResponse } from "../utils/cors";

/**
 * GET /api/alerts?from=ts1&to=ts2
 *
 * 查询告警历史记录，默认最近 7 天，最多保留 360 天
 */
export async function handleGetAlerts(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);
  const from = parseInt(url.searchParams.get("from") || "") || now - 7 * 86400; // 默认 7 天
  const to = parseInt(url.searchParams.get("to") || "") || now;
  
  // 限制最多查询 360 天
  const maxFrom = now - 360 * 86400;
  const actualFrom = Math.max(from, maxFrom);

  const result = await env.DB.prepare(
    "SELECT id, ts, symbol, created_by, alert_type, base_type, node_level, price, ref_price, change_percent, status FROM alerts WHERE symbol = ? AND ts >= ? AND ts <= ? ORDER BY ts DESC",
  )
    .bind("AU", actualFrom, to)
    .all();

  return jsonResponse(result.results || [], origin);
}
