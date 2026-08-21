import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

export interface HoldingLot {
  id: number;
  symbol: string;
  bought_ts: number;
  cost_price: number;
  qty: number; // 剩余克数
  note?: string | null;
}

/**
 * GET /api/holdings?symbol=AU
 *
 * 返回逐笔持仓批次明细 + 汇总：
 * - lots: 每个持仓批次（买入流水，剩余克数 > 0）
 * - total_qty / total_cost / avg_price：按批次剩余量累加
 * - realized_profit：累计已实现盈亏（所有卖出流水的 realized_pnl 之和）
 * - 浮盈浮亏由前端结合当前实时价格计算
 */
export async function handleGetHoldings(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "AU";
  const now = Math.floor(Date.now() / 1000);

  const lots = await env.DB.prepare(
    `SELECT id, symbol, ts AS bought_ts, price AS cost_price, remaining_qty AS qty, note
     FROM trades
     WHERE symbol = ? AND side = '买' AND remaining_qty > 0
     ORDER BY ts ASC, id ASC`,
  )
    .bind(symbol)
    .all<HoldingLot>();

  const realizedRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(realized_pnl), 0) AS realized
     FROM trades WHERE symbol = ? AND side = '卖'`,
  )
    .bind(symbol)
    .first<{ realized: number }>();

  let totalQty = 0;
  let totalCost = 0;
  for (const lot of lots.results) {
    totalQty += lot.qty;
    totalCost += lot.qty * lot.cost_price;
  }

  return jsonResponse(
    {
      symbol,
      lots: lots.results,
      total_qty: totalQty,
      total_cost: totalCost,
      avg_price: totalQty > 0 ? totalCost / totalQty : 0,
      realized_profit: realizedRow?.realized || 0,
      updated_ts: now,
    },
    origin,
  );
}
