import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

/**
 * GET /api/global-config?symbol=AU
 * 获取全局涨跌幅配置
 */
export async function handleGetGlobalConfig(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "AU";

  const config = await env.DB.prepare(
    "SELECT * FROM global_configs WHERE symbol = ?",
  )
    .bind(symbol)
    .first();

  if (!config) {
    return errorResponse("Global config not found", origin, 404);
  }

  return jsonResponse(config, origin);
}

/**
 * POST /api/global-config
 * 更新全局配置（管理员功能）
 */
export async function handlePostGlobalConfig(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const body = await request.json() as {
    symbol: string;
    rise_1?: number;
    rise_2?: number;
    rise_3?: number;
    fall_1?: number;
    fall_2?: number;
    fall_3?: number;
    market_status?: string;
  };

  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO global_configs (symbol, rise_1, rise_2, rise_3, fall_1, fall_2, fall_3, market_status, updated_ts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(symbol) DO UPDATE SET
       rise_1 = excluded.rise_1,
       rise_2 = excluded.rise_2,
       rise_3 = excluded.rise_3,
       fall_1 = excluded.fall_1,
       fall_2 = excluded.fall_2,
       fall_3 = excluded.fall_3,
       market_status = excluded.market_status,
       updated_ts = excluded.updated_ts`,
  )
    .bind(
      body.symbol,
      body.rise_1 ?? null,
      body.rise_2 ?? null,
      body.rise_3 ?? null,
      body.fall_1 ?? null,
      body.fall_2 ?? null,
      body.fall_3 ?? null,
      body.market_status ?? 'OPEN',
      now,
    )
    .run();

  return jsonResponse({ success: true }, origin);
}
