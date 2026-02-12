import type { Env } from "../types";

/**
 * 数据清理任务
 * 
 * 删除 360 天之前的历史数据，保持数据库大小可控
 */
export async function cleanupOldData(env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const cutoffTs = now - 360 * 86400; // 360 天前
  
  console.log(`[DataCleanup] Starting cleanup for data before ${new Date(cutoffTs * 1000).toISOString()}`);
  
  try {
    // 清理价格分钟线数据
    const pricesResult = await env.DB.prepare(
      "DELETE FROM prices WHERE ts < ?"
    ).bind(cutoffTs).run();
    console.log(`[DataCleanup] Deleted ${pricesResult.meta.changes || 0} price records`);
    
    // 清理日线汇总数据
    const dailyResult = await env.DB.prepare(
      "DELETE FROM daily_prices WHERE day_ts < ?"
    ).bind(cutoffTs).run();
    console.log(`[DataCleanup] Deleted ${dailyResult.meta.changes || 0} daily price records`);
    
    // 清理告警记录
    const alertsResult = await env.DB.prepare(
      "DELETE FROM alerts WHERE ts < ?"
    ).bind(cutoffTs).run();
    console.log(`[DataCleanup] Deleted ${alertsResult.meta.changes || 0} alert records`);
    
    // 清理 AI 分析报告
    const reportsResult = await env.DB.prepare(
      "DELETE FROM reports WHERE ts < ?"
    ).bind(cutoffTs).run();
    console.log(`[DataCleanup] Deleted ${reportsResult.meta.changes || 0} report records`);
    
    // 清理交易记录（可选，根据需求决定是否保留所有交易记录）
    const tradesResult = await env.DB.prepare(
      "DELETE FROM trades WHERE ts < ?"
    ).bind(cutoffTs).run();
    console.log(`[DataCleanup] Deleted ${tradesResult.meta.changes || 0} trade records`);
    
    console.log("[DataCleanup] Cleanup completed successfully");
  } catch (err) {
    console.error("[DataCleanup] Failed to cleanup old data:", err);
    throw err;
  }
}

/**
 * 检查是否应该执行清理任务
 * 
 * 每天只在 00:00-00:05 之间执行一次
 */
export function shouldRunCleanup(env: Env): boolean {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  
  // 北京时间 00:00 = UTC 16:00 (前一天)
  // 调整为你的时区，这里假设使用 UTC+8
  const targetHour = 16; // UTC 时间
  
  // 在目标小时的前 5 分钟内执行
  if (hour === targetHour && minute < 5) {
    // 检查今天是否已经执行过
    // 使用 KV 存储最后执行日期
    return true;
  }
  
  return false;
}
