import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";

/**
 * GET /api/holdings?symbol=AU
 * 获取持仓信息
 */
export async function handleGetHoldings(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "AU";

  const holding = await env.DB.prepare(
    "SELECT * FROM holdings WHERE symbol = ?",
  )
    .bind(symbol)
    .first();

  if (!holding) {
    // 如果没有记录，返回空持仓
    return jsonResponse({
      symbol,
      total_qty: 0,
      total_cost: 0,
      avg_price: 0,
      realized_profit: 0,
      updated_ts: Math.floor(Date.now() / 1000),
    }, origin);
  }

  return jsonResponse(holding, origin);
}

/**
 * 更新持仓（内部函数，由交易触发）
 */
export async function updateHolding(
  db: D1Database,
  symbol: string,
  side: string,
  price: number,
  qty: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  // 获取当前持仓
  const holding = await db
    .prepare("SELECT * FROM holdings WHERE symbol = ?")
    .bind(symbol)
    .first<{
      total_qty: number;
      total_cost: number;
      avg_price: number;
      realized_profit: number;
    }>();

  let newQty = holding?.total_qty || 0;
  let newCost = holding?.total_cost || 0;
  let newAvgPrice = 0;
  let newRealizedProfit = holding?.realized_profit || 0;

  if (side === "买") {
    // 买入：增加持仓
    newQty += qty;
    newCost += price * qty;
    newAvgPrice = newQty > 0 ? newCost / newQty : 0;
  } else if (side === "卖") {
    // 卖出：减少持仓
    if (newQty < qty) {
      throw new Error(`持仓不足：当前持仓 ${newQty} 克，卖出 ${qty} 克`);
    }
    
    // 计算已实现盈亏：(卖出价 - 平均成本) * 卖出数量
    const avgPrice = holding?.avg_price || 0;
    const profitFromSale = (price - avgPrice) * qty;
    newRealizedProfit += profitFromSale;
    
    newQty -= qty;
    // 按平均成本减少总成本
    newCost -= avgPrice * qty;
    newAvgPrice = newQty > 0 ? newCost / newQty : 0;
  }

  // 更新持仓
  await db
    .prepare(
      `INSERT INTO holdings (symbol, total_qty, total_cost, avg_price, realized_profit, updated_ts)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(symbol) DO UPDATE SET
         total_qty = excluded.total_qty,
         total_cost = excluded.total_cost,
         avg_price = excluded.avg_price,
         realized_profit = excluded.realized_profit,
         updated_ts = excluded.updated_ts`,
    )
    .bind(symbol, newQty, newCost, newAvgPrice, newRealizedProfit, now)
    .run();
}
