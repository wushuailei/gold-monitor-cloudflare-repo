import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

/**
 * GET /api/trades?from=ts1&to=ts2
 *
 * 查询买卖点记录，默认最近 7 天，最多保留 360 天
 */
export async function handleGetTrades(
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
    "SELECT id, ts, symbol, side, price, qty, note FROM trades WHERE symbol = ? AND ts >= ? AND ts <= ? ORDER BY ts ASC",
  )
    .bind("AU", actualFrom, to)
    .all();

  return jsonResponse(result.results || [], origin);
}

/**
 * POST /api/trades
 *
 * 新增买卖点记录
 * Body: { ts, side, price, qty?, note? }
 */
export async function handlePostTrade(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  try {
    const body: any = await request.json();

    const { ts, side, price, qty, note } = body;

    if (!ts || !side || !price) {
      return errorResponse("Missing required fields: ts, side, price", origin);
    }

    if (side !== "买" && side !== "卖") {
      return errorResponse("side must be 买 or 卖", origin);
    }

    await env.DB.prepare(
      "INSERT INTO trades (ts, symbol, side, price, qty, note) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(ts, "AU", side, price, qty || null, note || null)
      .run();

    return jsonResponse({ success: true }, origin, 201);
  } catch (err) {
    return errorResponse("Invalid request body", origin);
  }
}
