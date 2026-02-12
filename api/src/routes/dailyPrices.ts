import type { Env } from "../types";
import { jsonResponse } from "../utils/cors";

/**
 * GET /api/daily-prices?from=ts1&to=ts2
 *
 * 返回日线汇总数据，默认最近 7 天，最多保留 360 天
 */
export async function handleGetDailyPrices(
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
    "SELECT id, symbol, day_ts, max_price, min_price, max_ts, min_ts, last_updated FROM daily_prices WHERE symbol = ? AND day_ts >= ? AND day_ts <= ? ORDER BY day_ts ASC",
  )
    .bind("AU", actualFrom, to)
    .all();

  return jsonResponse(result.results || [], origin);
}
