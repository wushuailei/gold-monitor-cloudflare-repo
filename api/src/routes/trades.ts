import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

/**
 * GET /api/trades?from=ts1&to=ts2
 *
 * 查询买卖流水，默认最近 7 天，最多保留 360 天
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

  const maxFrom = now - 360 * 86400;
  const actualFrom = Math.max(from, maxFrom);

  const result = await env.DB.prepare(
    "SELECT id, ts, symbol, side, price, qty, note, lot_id, realized_pnl FROM trades WHERE symbol = ? AND ts >= ? AND ts <= ? ORDER BY ts ASC",
  )
    .bind("AU", actualFrom, to)
    .all();

  return jsonResponse(result.results || [], origin);
}

/**
 * POST /api/trades
 *
 * 新增买卖流水。
 *
 * 买入：插入一条买入流水，该流水即一个持仓批次（remaining_qty = qty）
 * 卖出：Body 需带 lot_id（指定卖出哪个批次），自动计算该笔已实现盈亏：
 *       realized_pnl = (卖出价 - 批次成本价) * 克数，并扣减批次剩余克数
 *
 * Body: { ts, side, price, qty?, note?, lot_id? }
 */
export async function handlePostTrade(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  try {
    const body: any = await request.json();

    const { ts, side, price, qty, note, lot_id } = body;

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

    if (side === "买") {
      // 买入：插入流水即创建批次
      await env.DB.prepare(
        `INSERT INTO trades (ts, symbol, side, price, qty, note, remaining_qty)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(ts, symbol, side, price, qty, note || null, qty)
        .run();
      return jsonResponse({ success: true }, origin, 201);
    }

    // 卖出：必须指定批次
    if (!lot_id) {
      return errorResponse("卖出必须指定 lot_id", origin);
    }

    // 校验批次存在且剩余克数充足
    const lot = await env.DB.prepare(
      `SELECT id, price, remaining_qty FROM trades
       WHERE id = ? AND symbol = ? AND side = '买'`,
    )
      .bind(lot_id, symbol)
      .first<{ id: number; price: number; remaining_qty: number }>();

    if (!lot) {
      return errorResponse("指定的持仓批次不存在", origin, 404);
    }
    if (lot.remaining_qty < qty) {
      return errorResponse(
        `持仓不足：该批次仅剩 ${lot.remaining_qty} 克，卖出 ${qty} 克`,
        origin,
      );
    }

    const realizedPnl = (price - lot.price) * qty;

    // 事务：扣减批次克数 + 插入卖出流水
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE trades SET remaining_qty = remaining_qty - ? WHERE id = ?",
      ).bind(qty, lot_id),
      env.DB.prepare(
        `INSERT INTO trades (ts, symbol, side, price, qty, note, lot_id, realized_pnl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(ts, symbol, side, price, qty, note || null, lot_id, realizedPnl),
    ]);

    return jsonResponse({ success: true, realized_pnl: realizedPnl }, origin, 201);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to create trade", origin, 400);
  }
}

/**
 * DELETE /api/trades/:id
 *
 * 删除买卖流水，并回滚批次数据：
 * - 删除卖出流水：恢复对应批次剩余克数
 * - 删除买入流水：若有卖出记录已关联该批次，拒绝删除（先删卖出）
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

    const existingTrade = await env.DB.prepare(
      "SELECT id, side, qty, lot_id, realized_pnl FROM trades WHERE id = ?",
    )
      .bind(tradeId)
      .first<{
        id: number;
        side: string;
        qty: number;
        lot_id: number | null;
        realized_pnl: number | null;
      }>();

    if (!existingTrade) {
      return errorResponse("Trade not found", origin, 404);
    }

    if (existingTrade.side === "卖") {
      // 删除卖出：恢复批次剩余克数，再删除流水
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE trades SET remaining_qty = remaining_qty + ? WHERE id = ?",
        ).bind(existingTrade.qty, existingTrade.lot_id),
        env.DB.prepare("DELETE FROM trades WHERE id = ?").bind(tradeId),
      ]);
      return jsonResponse({ success: true }, origin);
    }

    // 买入批次：检查是否已被卖出
    const sellCount = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM trades WHERE lot_id = ?",
    )
      .bind(tradeId)
      .first<{ cnt: number }>();

    if (sellCount && sellCount.cnt > 0) {
      return errorResponse(
        `该批次已有 ${sellCount.cnt} 笔卖出记录，请先删除对应的卖出记录`,
        origin,
        409,
      );
    }

    await env.DB.prepare("DELETE FROM trades WHERE id = ?").bind(tradeId).run();
    return jsonResponse({ success: true }, origin);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete trade", origin, 500);
  }
}
