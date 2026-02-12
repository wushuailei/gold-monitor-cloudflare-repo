import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

const VALID_TARGET_CMPS = new Set(["EQ", "GTE", "LTE"]);

function normalizeCmp(input: unknown): string {
  if (typeof input !== "string") return "GTE";
  const upper = input.toUpperCase();
  return VALID_TARGET_CMPS.has(upper) ? upper : "GTE";
}

function normalizeNumber(input: unknown): number | null {
  if (typeof input !== "number" || Number.isNaN(input)) return null;
  return input;
}

/**
 * GET /api/targets?all=1
 *
 * 查询用户配置（默认返回当前用户；all=1 返回全部）
 */
export async function handleGetTargets(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "1";
  const symbol = url.searchParams.get("symbol") || "AU";

  const createdBy =
    request.headers.get("Cf-Access-Authenticated-User-Email") || "anonymous";

  const result = all
    ? await env.DB.prepare(
        "SELECT id, symbol, created_by, target_price, target_alert, target_cmp, rise_1, rise_2, rise_3, fall_1, fall_2, fall_3, created_ts FROM user_configs WHERE symbol = ? ORDER BY created_ts DESC",
      )
        .bind(symbol)
        .all()
    : await env.DB.prepare(
        "SELECT id, symbol, created_by, target_price, target_alert, target_cmp, rise_1, rise_2, rise_3, fall_1, fall_2, fall_3, created_ts FROM user_configs WHERE symbol = ? AND created_by = ? ORDER BY created_ts DESC LIMIT 1",
      )
        .bind(symbol, createdBy)
        .all();

  return jsonResponse(result.results || [], origin);
}

/**
 * POST /api/targets
 *
 * 设置用户配置
 * Body: { target_price?, target_alert?, target_cmp?, rise_1?, rise_2?, rise_3?, fall_1?, fall_2?, fall_3? }
 */
export async function handlePostTarget(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  try {
    const body: any = await request.json();

    const createdBy =
      request.headers.get("Cf-Access-Authenticated-User-Email") || "anonymous";
    const symbol = body.symbol || "AU";
    const ts = Math.floor(Date.now() / 1000);

    const targetPrice = normalizeNumber(body.target_price);
    const targetAlert = body.target_alert ? 1 : 0;
    const targetCmp = normalizeCmp(body.target_cmp);

    const rise1 = normalizeNumber(body.rise_1);
    const rise2 = normalizeNumber(body.rise_2);
    const rise3 = normalizeNumber(body.rise_3);
    const fall1 = normalizeNumber(body.fall_1);
    const fall2 = normalizeNumber(body.fall_2);
    const fall3 = normalizeNumber(body.fall_3);

    await env.DB.prepare(
      `INSERT INTO user_configs (symbol, created_by, target_price, target_alert, target_cmp, rise_1, rise_2, rise_3, fall_1, fall_2, fall_3, created_ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(symbol, created_by) DO UPDATE SET
         target_price = excluded.target_price,
         target_alert = excluded.target_alert,
         target_cmp = excluded.target_cmp,
         rise_1 = excluded.rise_1,
         rise_2 = excluded.rise_2,
         rise_3 = excluded.rise_3,
         fall_1 = excluded.fall_1,
         fall_2 = excluded.fall_2,
         fall_3 = excluded.fall_3,
         created_ts = excluded.created_ts`,
    )
      .bind(
        symbol,
        createdBy,
        targetPrice,
        targetAlert,
        targetCmp,
        rise1,
        rise2,
        rise3,
        fall1,
        fall2,
        fall3,
        ts,
      )
      .run();

    return jsonResponse({ success: true }, origin, 201);
  } catch (err) {
    return errorResponse("Invalid request body", origin);
  }
}

/**
 * DELETE /api/targets/:id
 *
 * 删除用户配置
 */
export async function handleDeleteTarget(
  id: string,
  env: Env,
  origin?: string,
): Promise<Response> {
  const targetId = parseInt(id);
  if (isNaN(targetId)) {
    return errorResponse("Invalid target id", origin);
  }

  await env.DB.prepare("DELETE FROM user_configs WHERE id = ? AND symbol = ?")
    .bind(targetId, "AU")
    .run();

  return jsonResponse({ success: true }, origin);
}
