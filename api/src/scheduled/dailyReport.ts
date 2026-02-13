import type { Env } from "../types";
import { generateReport, getRecentPrices, getDailyPrices } from "./aiAnalysis";
import { sendFeishu, buildReportMessage } from "../services/feishu";
import { formatTs } from "../utils/time";

/**
 * 每日早报：生成并发送 AI 分析报告
 * 
 * 执行时间：每天北京时间 09:00
 * 分析内容：
 * - 昨日金价走势回顾
 * - 当前市场状态
 * - 今日操作建议
 */
export async function sendDailyReport(
  env: Env,
  ts: number,
  symbol: string = "AU",
): Promise<void> {
  console.log(`[DailyReport] Generating daily report at ${formatTs(ts)}`);

  // 1. 获取当前价格
  const currentPrice = await env.DB.prepare(
    "SELECT price FROM prices WHERE symbol = ? ORDER BY ts DESC LIMIT 1",
  )
    .bind(symbol)
    .first<{ price: number }>();

  if (!currentPrice) {
    console.error("[DailyReport] No current price found");
    return;
  }

  const priceNow = currentPrice.price;

  // 2. 获取昨日收盘价（昨天 23:59 的价格）
  const yesterdayEndTs = ts - 86400; // 24小时前
  const yesterdayClose = await env.DB.prepare(
    "SELECT price FROM prices WHERE symbol = ? AND ts <= ? ORDER BY ts DESC LIMIT 1",
  )
    .bind(symbol, yesterdayEndTs)
    .first<{ price: number }>();

  // 3. 计算昨日涨跌幅
  let change24h: number | null = null;
  if (yesterdayClose) {
    change24h = ((priceNow - yesterdayClose.price) / yesterdayClose.price) * 100;
  }

  // 4. 获取最近30分钟的价格序列
  const recentPrices = await getRecentPrices(env.DB, symbol, ts, 30);

  // 5. 获取过去3天的日线数据
  const dailyPrices = await getDailyPrices(env.DB, symbol, 3);

  // 6. 计算短期涨跌幅
  let change5m: number | null = null;
  const price5mAgo = recentPrices.find((p) => p.ts <= ts - 300);
  if (price5mAgo) {
    change5m = ((priceNow - price5mAgo.price) / price5mAgo.price) * 100;
  }

  // 7. 调用 AI 生成报告
  const reportResult = await generateReport(env, {
    symbol,
    priceNow,
    change1m: null, // 早报不需要1分钟数据
    change5m,
    recentPrices,
    dailyPrices, // 添加日线数据
  });

  if (!reportResult) {
    console.error("[DailyReport] Failed to generate AI report");
    return;
  }

  // 8. 构造消息内容
  const lines = [
    "📊 [AU 金价早报]",
    `时间: ${formatTs(ts)}`,
    `当前价: ${priceNow.toFixed(2)} 元/克`,
  ];

  if (yesterdayClose && change24h !== null) {
    const changeIcon = change24h >= 0 ? "📈" : "📉";
    lines.push(
      `昨日收盘: ${yesterdayClose.price.toFixed(2)} 元/克`,
      `24h涨跌: ${changeIcon} ${change24h.toFixed(2)}%`,
    );
  }

  lines.push("", "═══════════════════", "");
  lines.push(reportResult.reportMd);
  lines.push("", "═══════════════════");
  lines.push(`模型: ${reportResult.model}`);

  const message = lines.join("\n");

  // 9. 发送到飞书
  if (env.FEISHU_WEBHOOK) {
    const sent = await sendFeishu(env.FEISHU_WEBHOOK, message);
    if (sent) {
      console.log("[DailyReport] Daily report sent successfully");
    } else {
      console.error("[DailyReport] Failed to send daily report to Feishu");
    }
  } else {
    console.warn("[DailyReport] FEISHU_WEBHOOK not configured, skipping send");
  }

  // 10. 保存报告到数据库
  try {
    await env.DB.prepare(
      `INSERT INTO reports (symbol, ts, model, report_md, trigger_type, trigger_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        symbol,
        ts,
        reportResult.model,
        reportResult.reportMd,
        "DAILY",
        change24h !== null ? change24h.toFixed(2) : "0",
      )
      .run();
    console.log("[DailyReport] Report saved to database");
  } catch (err) {
    console.error("[DailyReport] Failed to save report:", err);
  }
}

/**
 * 检查是否应该发送今日早报
 * 
 * 执行时间：北京时间 09:00-09:05（UTC 01:00-01:05）
 * 使用 KV 存储去重，确保每天只发送一次
 */
export async function shouldSendDailyReport(
  env: Env,
  currentTs: number,
): Promise<boolean> {
  const now = new Date(currentTs * 1000);
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // 北京时间 09:00 = UTC 01:00
  const targetHour = 1;

  if (hour !== targetHour || minute >= 5) {
    return false;
  }

  // 检查今天是否已经发送过
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const lastReportDate = await env.KV.get("last_daily_report_date");

  if (lastReportDate === today) {
    return false; // 今天已经发送过
  }

  // 标记今天已发送
  await env.KV.put("last_daily_report_date", today);
  return true;
}
