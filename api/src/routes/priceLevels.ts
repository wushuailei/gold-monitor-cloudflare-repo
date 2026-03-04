import type { Env } from "../types";
import { jsonResponse } from "../utils/cors";

/**
 * GET /api/price-levels?from=ts1&to=ts2
 *
 * 查询关口记录，默认最近 7 天，最多保留 360 天
 */
export async function handleGetPriceLevels(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);
  const from = parseInt(url.searchParams.get("from") || "") || now - 7 * 86400;
  const to = parseInt(url.searchParams.get("to") || "") || now;

  const maxFrom = now - 360 * 86400;
  const actualFrom = Math.max(from, maxFrom);

  const result = await env.DB.prepare(
    "SELECT id, ts, symbol, price_level, direction, price, status, error FROM price_levels WHERE symbol = ? AND ts >= ? AND ts <= ? ORDER BY ts DESC",
  )
    .bind("AU", actualFrom, to)
    .all();

  return jsonResponse(result.results || [], origin);
}
