import type { Env } from "../types";

import { nowTs, getTodayMidnightTs } from "../utils/time";

import { fetchGoldPrice } from "./fetchPrice";
import { runAlertEngine } from "./alertEngine";
import { checkTargets } from "./targetCheck";
import { cleanupOldData } from "./dataCleanup";
import { sendDailyReport, shouldSendDailyReport } from "./dailyReport";

/**
 * Scheduled Worker 主流程
 *
 * 每分钟执行：
 * 1. 拉取金价 → 写入 prices
 * 2. 日线汇总 → 更新 daily_prices
 * 3. 告警引擎 → 基于昨日收盘价/买入价对比的涨跌幅节点告警
 * 4. 目标价检查 → 基于 user_configs 的目标价提醒
 * 5. 数据清理 → 每天 00:00 清理 360 天前的数据
 * 6. 每日早报 → 每天 09:00 发送 AI 分析报告
 */
export async function handleScheduled(
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  const ts = nowTs();
  const symbol = "AU";

  // ── Step -1: 检查市场状态 ──
  const globalConfig = await env.DB.prepare(
    "SELECT market_status FROM global_configs WHERE symbol = ?",
  )
    .bind(symbol)
    .first<{ market_status: string }>();

  const isMarketOpen = globalConfig?.market_status === 'OPEN';

  if (!isMarketOpen) {
    console.log("[Scheduled] Market is closed, skipping price fetch and alerts");
    // 停盘时仍然执行数据清理和早报
  }

  // ── Step 0: 检查是否需要执行数据清理（每天一次） ──
  try {
    const shouldCleanup = await shouldRunCleanupToday(env, ts);
    if (shouldCleanup) {
      console.log("[Scheduled] Running daily data cleanup...");
      await cleanupOldData(env);
    }
  } catch (err) {
    console.error("[Scheduled] Data cleanup failed:", err);
    // 清理失败不影响主流程
  }

  // ── Step 0.5: 检查是否需要发送每日早报（每天一次） ──
  try {
    const shouldReport = await shouldSendDailyReport(env, ts);
    if (shouldReport) {
      console.log("[Scheduled] Sending daily report...");
      await sendDailyReport(env, ts, symbol);
    }
  } catch (err) {
    console.error("[Scheduled] Daily report failed:", err);
    // 早报失败不影响主流程
  }

  // 如果停盘，跳过价格抓取和告警
  if (!isMarketOpen) {
    return;
  }

  // ── Step 1: 拉取金价 ──
  const result = await fetchGoldPrice(env);
  if (!result) {
    console.error("Failed to fetch gold price, skipping this cycle");
    return;
  }

  const { price: priceNow, xau, source } = result;
  console.log(
    `[${symbol}] ts=${ts} price=${priceNow} xau=${xau} source=${source}`,
  );

  // ── Step 2: 写入数据库 ──
  try {
    await env.DB.prepare(
      `INSERT INTO prices (symbol, ts, price, xau_price, source) VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(symbol, ts, priceNow, xau, source)
      .run();
  } catch (err) {
    console.error("Failed to insert price record:", err);
  }

  // ── Step 3: 日线汇总 ──
  const todayTs = getTodayMidnightTs();
  try {
    const existing = await env.DB.prepare(
      `SELECT max_price, min_price FROM daily_prices WHERE symbol = ? AND day_ts = ?`,
    )
      .bind(symbol, todayTs)
      .first<{ max_price: number; min_price: number }>();

    if (!existing) {
      await env.DB.prepare(
        `INSERT INTO daily_prices (symbol, day_ts, max_price, min_price, max_ts, min_ts, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(symbol, todayTs, priceNow, priceNow, ts, ts, ts)
        .run();
    } else {
      const newMax = priceNow > existing.max_price;
      const newMin = priceNow < existing.min_price;

      if (newMax || newMin) {
        // 构建动态 UPDATE 语句
        const updates: string[] = ["last_updated = ?"];
        const bindings: any[] = [symbol, todayTs, ts];
        
        if (newMax) {
          updates.push("max_price = ?", "max_ts = ?");
          bindings.push(priceNow, ts);
        }
        if (newMin) {
          updates.push("min_price = ?", "min_ts = ?");
          bindings.push(priceNow, ts);
        }

        await env.DB.prepare(
          `UPDATE daily_prices SET ${updates.join(", ")} WHERE symbol = ? AND day_ts = ?`,
        )
          .bind(...bindings)
          .run();
      }
    }
  } catch (err) {
    console.error("Failed to handle daily stats:", err);
  }

  // ── Step 4: 告警引擎（涨跌幅节点） ──
  try {
    await runAlertEngine(env, priceNow, ts, symbol);
  } catch (err) {
    console.error("Failed to run alert engine:", err);
  }

  // ── Step 5: 目标价检查 ──
  try {
    await checkTargets(env, priceNow, ts, symbol);
  } catch (err) {
    console.error("Failed to check targets:", err);
  }
}

/**
 * 检查今天是否应该执行清理任务
 * 
 * 使用 KV 存储最后清理日期，确保每天只执行一次
 */
async function shouldRunCleanupToday(env: Env, currentTs: number): Promise<boolean> {
  const now = new Date(currentTs * 1000);
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  
  // 北京时间 00:00 = UTC 16:00 (前一天)
  // 在 UTC 16:00-16:05 之间执行（北京时间 00:00-00:05）
  const targetHour = 16;
  
  if (hour !== targetHour || minute >= 5) {
    return false;
  }
  
  // 检查今天是否已经执行过
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const lastCleanupDate = await env.KV.get('last_cleanup_date');
  
  if (lastCleanupDate === today) {
    return false; // 今天已经执行过
  }
  
  // 标记今天已执行
  await env.KV.put('last_cleanup_date', today);
  return true;
}
