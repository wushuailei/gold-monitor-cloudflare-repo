import type { Env } from "../types";

import { nowTs, getTodayMidnightTs } from "../utils/time";

import { fetchGoldPrice } from "./fetchPrice";
import { runAlertEngine } from "./alertEngine";
import { checkTargets } from "./targetCheck";
import { checkPriceLevels } from "./priceLevelCheck";
import { cleanupOldData } from "./dataCleanup";
import { sendDailyReport, shouldSendDailyReport } from "./dailyReport";

/**
 * Scheduled Worker 主流程
 *
 * 每分钟执行：
 * 1. 拉取金价 → 写入 prices
 * 2. 日线汇总 → 更新 daily_prices
 * 3. 告警引擎 → 基于昨日收盘价/买入价对比的涨跌幅节点告警
 * 4. 目标价检查 → 基于 user_targets 的目标价提醒
 * 5. 整数关口检查 → 每跨越 10 元关口提醒
 * 6. 数据清理 → 每天 00:00 清理 360 天前的数据
 * 7. 每日早报 → 每天 09:00 发送 AI 分析报告
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

  // ── Step 2.5: 价格异常检测 ──
  // 如果价格涨跌超过 1000，跳过后续告警操作（防止异常数据）
  const lastPriceRecord = await env.DB.prepare(
    `SELECT price FROM prices WHERE symbol = ? ORDER BY ts DESC LIMIT 1 OFFSET 1`,
  )
    .bind(symbol)
    .first<{ price: number }>();

  if (lastPriceRecord && Math.abs(priceNow - lastPriceRecord.price) > 1000) {
    console.error(
      `[Scheduled] Price anomaly detected: ${lastPriceRecord.price} → ${priceNow}, skipping alerts`
    );
    return;
  }

  // ── Step 3: 日线汇总 ──
  const todayTs = getTodayMidnightTs();
  try {
    const existing = await env.DB.prepare(
      `SELECT max_price, min_price, open_price, close_price FROM daily_prices WHERE symbol = ? AND day_ts = ?`,
    )
      .bind(symbol, todayTs)
      .first<{ max_price: number; min_price: number; open_price: number | null; close_price: number | null }>();

    // 判断是否需要记录开盘价（北京时间 9:00-9:05）
    const beijingHour = getBeijingHour(ts);
    const beijingMinute = getBeijingMinute(ts);
    const isOpenTime = beijingHour === 9 && beijingMinute < 5;
    // 判断是否需要记录收盘价（北京时间 23:55-24:00，即 23:55-23:59）
    const isCloseTime = beijingHour === 23 && beijingMinute >= 55;

    if (!existing) {
      await env.DB.prepare(
        `INSERT INTO daily_prices (symbol, day_ts, open_price, open_ts, close_price, close_ts, max_price, min_price, max_ts, min_ts, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(symbol, todayTs, 
          isOpenTime ? priceNow : null, 
          isOpenTime ? ts : null,
          isCloseTime ? priceNow : null,
          isCloseTime ? ts : null,
          priceNow, priceNow, ts, ts, ts)
        .run();
    } else {
      const updates: string[] = ["last_updated = ?"];
      const bindings: any[] = [ts];
      
      // 更新开盘价（仅在开盘时间段且尚未记录时）
      if (isOpenTime && !existing.open_price) {
        updates.push("open_price = ?", "open_ts = ?");
        bindings.push(priceNow, ts);
      }
      
      // 更新收盘价（仅在收盘时间段）
      if (isCloseTime) {
        updates.push("close_price = ?", "close_ts = ?");
        bindings.push(priceNow, ts);
      }
      
      // 更新最高价
      if (priceNow > existing.max_price) {
        updates.push("max_price = ?", "max_ts = ?");
        bindings.push(priceNow, ts);
      }
      
      // 更新最低价
      if (priceNow < existing.min_price) {
        updates.push("min_price = ?", "min_ts = ?");
        bindings.push(priceNow, ts);
      }

      bindings.push(symbol, todayTs);
      await env.DB.prepare(
        `UPDATE daily_prices SET ${updates.join(", ")} WHERE symbol = ? AND day_ts = ?`,
      )
        .bind(...bindings)
        .run();
    }
  } catch (err) {
    console.error("Failed to handle daily stats:", err);
  }

  // ── Step 4: 告警引擎（涨跌幅节点） ──
  // ── Step 5: 目标价检查 ──
  // ── Step 6: 整数关口检查 ──
  // 只在工作日 9:00-23:00（北京时间）期间发送提醒
  if (isWithinAlertHours(ts)) {
    try {
      await runAlertEngine(env, priceNow, ts, symbol);
    } catch (err) {
      console.error("Failed to run alert engine:", err);
    }

    try {
      await checkTargets(env, priceNow, ts, symbol);
    } catch (err) {
      console.error("Failed to check targets:", err);
    }

    try {
      await checkPriceLevels(env, priceNow, ts, symbol);
    } catch (err) {
      console.error("Failed to check price levels:", err);
    }
  } else {
    console.log("[Scheduled] Outside alert hours (weekdays 9:00-23:00 Beijing time), skipping alerts");
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

/**
 * 检查当前时间是否在提醒时段内
 * 
 * 规则：工作日（周一至周五）北京时间 9:00-23:00
 * 北京时间 = UTC + 8
 * 所以：北京时间 9:00 = UTC 1:00，北京时间 23:00 = UTC 15:00
 */
function isWithinAlertHours(currentTs: number): boolean {
  const now = new Date(currentTs * 1000);
  
  // 获取 UTC 时间
  const utcHour = now.getUTCHours();
  const utcDay = now.getUTCDay(); // 0=周日, 1=周一, ..., 6=周六
  
  // 转换为北京时间的小时数
  // UTC 0:00 = 北京时间 8:00
  // UTC 16:00 = 北京时间 0:00（次日）
  let beijingHour = utcHour + 8;
  
  // 处理跨日情况
  let beijingDay = utcDay;
  if (beijingHour >= 24) {
    beijingHour -= 24;
    beijingDay = (utcDay + 1) % 7;
  }
  
  // 检查是否为工作日（周一至周五，即 1-5）
  const isWeekday = beijingDay >= 1 && beijingDay <= 5;
  if (!isWeekday) {
    return false;
  }
  
  // 检查是否在 9:00-23:00 范围内
  const isWithinHours = beijingHour >= 9 && beijingHour < 23;
  return isWithinHours;
}

/**
 * 获取北京时间的 hour（0-23）
 */
function getBeijingHour(currentTs: number): number {
  const now = new Date(currentTs * 1000);
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  
  // 北京时间 = UTC + 8
  // 考虑分钟，UTC 15:59 北京时间 23:59
  let beijingHour = utcHour + 8;
  if (beijingHour >= 24) {
    beijingHour -= 24;
  }
  return beijingHour;
}

/**
 * 获取北京时间的 minute（0-59）
 */
function getBeijingMinute(currentTs: number): number {
  const now = new Date(currentTs * 1000);
  return now.getUTCMinutes();
}
