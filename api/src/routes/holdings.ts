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
    return jsonResponse(
      {
        symbol,
        total_qty: 0,
        avg_price: 0,
        total_cost: 0,
        realized_profit: 0,
        updated_ts: Math.floor(Date.now() / 1000),
      },
      origin,
    );
  }

  const result = {
    ...holding,
    total_cost: (holding as any).total_qty * (holding as any).avg_price,
  };

  return jsonResponse(result, origin);
}

/**
 * 更新持仓（内部函数，由交易触发）
 * 
 * 买入：新平均价 = (原克数 × 原均价 + 新买入克数 × 买入价) / 总克数
 * 卖出：已实现盈亏 += (卖出价 - 平均价) × 卖出克数
 */
export async function updateHolding(
  db: D1Database,
  symbol: string,
  side: string,
  price: number,
  qty: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  const holding = await db
    .prepare("SELECT * FROM holdings WHERE symbol = ?")
    .bind(symbol)
    .first<{
      total_qty: number;
      avg_price: number;
      realized_profit: number;
    }>();

  let newQty = holding?.total_qty || 0;
  let newAvgPrice = holding?.avg_price || 0;
  let newRealizedProfit = holding?.realized_profit || 0;

  if (side === "买") {
    const oldTotalCost = newQty * newAvgPrice;
    const newTotalCost = oldTotalCost + price * qty;
    newQty += qty;
    newAvgPrice = newQty > 0 ? newTotalCost / newQty : 0;
  } else if (side === "卖") {
    if (newQty < qty) {
      throw new Error(`持仓不足：当前持仓 ${newQty} 克，卖出 ${qty} 克`);
    }

    const profitFromSale = (price - newAvgPrice) * qty;
    newRealizedProfit += profitFromSale;
    newQty -= qty;
    if (newQty === 0) {
      newAvgPrice = 0;
    }
  }

  await db
    .prepare(
      `INSERT INTO holdings (symbol, total_qty, avg_price, realized_profit, updated_ts)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(symbol) DO UPDATE SET
         total_qty = excluded.total_qty,
         avg_price = excluded.avg_price,
         realized_profit = excluded.realized_profit,
         updated_ts = excluded.updated_ts`,
    )
    .bind(symbol, newQty, newAvgPrice, newRealizedProfit, now)
    .run();
}

/**
 * 重新计算持仓（在删除或修改交易时调用）
 */
export async function recalculateHolding(
  db: D1Database,
  symbol: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  const trades = await db
    .prepare("SELECT * FROM trades WHERE symbol = ? ORDER BY ts ASC")
    .bind(symbol)
    .all<{
      id: number;
      ts: number;
      side: string;
      price: number;
      qty: number;
    }>();

  let totalQty = 0;
  let totalCost = 0;
  let realizedProfit = 0;

  for (const trade of trades.results) {
    if (trade.side === "买") {
      totalCost += trade.price * trade.qty;
      totalQty += trade.qty;
    } else if (trade.side === "卖") {
      const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;
      realizedProfit += (trade.price - avgPrice) * trade.qty;
      totalCost -= avgPrice * trade.qty;
      totalQty -= trade.qty;
    }
  }

  const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

  await db
    .prepare(
      `INSERT INTO holdings (symbol, total_qty, avg_price, realized_profit, updated_ts)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(symbol) DO UPDATE SET
         total_qty = excluded.total_qty,
         avg_price = excluded.avg_price,
         realized_profit = excluded.realized_profit,
         updated_ts = excluded.updated_ts`,
    )
    .bind(symbol, totalQty, avgPrice, realizedProfit, now)
    .run();
}
