import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";
import { updateHolding, recalculateHolding } from "./holdings";

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
 * 新增买卖点记录，并自动更新持仓
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

    if (!qty || qty <= 0) {
      return errorResponse("qty must be greater than 0", origin);
    }

    const symbol = "AU";

    // 开始事务：插入交易记录 + 更新持仓
    try {
      // 插入交易记录
      await env.DB.prepare(
        "INSERT INTO trades (ts, symbol, side, price, qty, note) VALUES (?, ?, ?, ?, ?, ?)",
      )
        .bind(ts, symbol, side, price, qty, note || null)
        .run();

      // 更新持仓
      await updateHolding(env.DB, symbol, side, price, qty);

      return jsonResponse({ success: true }, origin, 201);
    } catch (err: any) {
      return errorResponse(
        err.message || "Failed to create trade",
        origin,
        400,
      );
    }
  } catch (err) {
    return errorResponse("Invalid request body", origin);
  }
}

/**
 * DELETE /api/trades/:id
 *
 * 删除买卖点记录，并重新计算持仓
 */
export async function handleDeleteTrade(
  id: string,
  env: Env,
  origin?: string,
): Promise<Response> {
  try {
    const tradeId = parseInt(id);
    if (isNaN(tradeId)) {
      return errorResponse("Invalid trade ID", origin, 400);
    }

    const symbol = "AU"; // 目前默认只处理 AU

    // 获取要删除的交易记录，验证是否存在
    const existingTrade = await env.DB.prepare(
      "SELECT * FROM trades WHERE id = ? AND symbol = ?",
    )
      .bind(tradeId, symbol)
      .first();

    if (!existingTrade) {
      return errorResponse("Trade not found", origin, 404);
    }

    // 删除交易记录
    await env.DB.prepare("DELETE FROM trades WHERE id = ?").bind(tradeId).run();

    // 重新计算持仓
    await recalculateHolding(env.DB, symbol);

    return jsonResponse({ success: true }, origin);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete trade", origin, 500);
  }
}
