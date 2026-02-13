import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

/**
 * GET /api/user-targets?symbol=AU
 * 获取目标价列表
 */
export async function handleGetUserTargets(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "AU";

  const result = await env.DB.prepare(
    "SELECT * FROM user_targets WHERE symbol = ? ORDER BY created_ts DESC",
  )
    .bind(symbol)
    .all();

  return jsonResponse(result.results || [], origin);
}

/**
 * POST /api/user-targets
 * 创建新的目标价
 */
export async function handlePostUserTarget(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const body = await request.json() as {
    symbol: string;
    target_price: number;
    target_cmp: string;
  };

  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO user_targets (symbol, target_price, target_alert, target_cmp, created_ts, updated_ts)
     VALUES (?, ?, 1, ?, ?, ?)`,
  )
    .bind(
      body.symbol,
      body.target_price,
      body.target_cmp,
      now,
      now,
    )
    .run();

  return jsonResponse({ success: true }, origin);
}

/**
 * DELETE /api/user-targets/:id
 * 删除目标价
 */
export async function handleDeleteUserTarget(
  id: string,
  env: Env,
  origin?: string,
): Promise<Response> {
  await env.DB.prepare("DELETE FROM user_targets WHERE id = ?")
    .bind(parseInt(id))
    .run();

  return jsonResponse({ success: true }, origin);
}

/**
 * PUT /api/user-targets/:id
 * 更新目标价
 */
export async function handlePutUserTarget(
  id: string,
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const body = await request.json() as {
    target_price: number;
    target_cmp: string;
    target_alert: number;
  };

  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `UPDATE user_targets 
     SET target_price = ?, target_cmp = ?, target_alert = ?, updated_ts = ?
     WHERE id = ?`,
  )
    .bind(
      body.target_price,
      body.target_cmp,
      body.target_alert,
      now,
      parseInt(id),
    )
    .run();

  return jsonResponse({ success: true }, origin);
}
