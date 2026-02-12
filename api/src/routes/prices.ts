import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

/**
 * GET /api/prices?from=ts1&to=ts2
 *
 * 返回金价分钟线数据，默认最近 24 小时，最多保留 360 天
 */
export async function handleGetPrices(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);
  const from = parseInt(url.searchParams.get("from") || "") || now - 86400; // 默认 24 小时
  const to = parseInt(url.searchParams.get("to") || "") || now;
  
  // 限制最多查询 360 天
  const maxFrom = now - 360 * 86400;
  const actualFrom = Math.max(from, maxFrom);

  const result = await env.DB.prepare(
    "SELECT ts, price FROM prices WHERE symbol = ? AND ts >= ? AND ts <= ? ORDER BY ts ASC",
  )
    .bind("AU", actualFrom, to)
    .all();

  const data = (result.results || []).map((r) => ({
    ts: r.ts,
    price: r.price,
  }));

  return jsonResponse(data, origin);
}
