import OpenAI from "openai";
import type { Env } from "../types";
import { formatTs } from "../utils/time";

interface PricePoint {
  ts: number;
  price: number;
}

interface AnalysisInput {
  symbol: string;
  priceNow: number;
  change1m: number | null;
  change5m: number | null;
  recentPrices: PricePoint[];
  dailyPrices?: { date: string; high: number; low: number; high_time: string; low_time: string }[];
}

export async function generateReport(
  env: Env,
  input: AnalysisInput,
): Promise<{ model: string; reportMd: string } | null> {
  if (!env.AI_API_KEY) {
    console.error("AI_API_KEY not configured");
    return null;
  }

  const model = env.AI_MODEL || "glm-5";
  const baseURL = env.AI_API_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";

  const openai = new OpenAI({
    apiKey: env.AI_API_KEY,
    baseURL,
  });

  const systemPrompt = `你是一位专业的黄金市场分析师。请根据提供的实时金价数据和历史日线数据，用中文输出简洁的 Markdown 格式分析报告。

**重要声明**：本报告仅供参考，不构成投资建议。投资有风险，决策需谨慎。

报告包含以下部分：

## 市场回顾
简要分析近期的价格走势和关键变化（2-3 条）

## 短期展望
分析当前市场状态和可能的影响因素：
- 当前趋势判断
- 关键支撑位和阻力位
- 主要风险因素

## 操作建议
分别给出三种策略：
- **保守**: 适合风险厌恶型投资者
- **中性**: 适合普通投资者
- **激进**: 适合短线交易者

注意：基于数据分析，保持客观，避免过度预测。`;

  let userPrompt = `当前时间: ${formatTs(Math.floor(Date.now() / 1000))}

品种: ${input.symbol}
当前价: ${input.priceNow.toFixed(2)} 元/克`;

  if (input.dailyPrices && input.dailyPrices.length > 0) {
    userPrompt += `\n\n过去三天日线数据：\n`;
    input.dailyPrices.forEach((day) => {
      userPrompt += `${day.date}: 最高${day.high.toFixed(2)}(${day.high_time}) 最低${day.low.toFixed(2)}(${day.low_time}) 波动${((day.high - day.low) / day.low * 100).toFixed(2)}%\n`;
    });
  }

  if (input.change1m !== null || input.change5m !== null) {
    userPrompt += `\n短期变化：\n`;
    if (input.change1m !== null) {
      userPrompt += `1分钟: ${input.change1m.toFixed(2)}%\n`;
    }
    if (input.change5m !== null) {
      userPrompt += `5分钟: ${input.change5m.toFixed(2)}%\n`;
    }
  }

  if (input.recentPrices.length > 0) {
    userPrompt += `\n最近价格序列（最新在前）:\n`;
    userPrompt += input.recentPrices
      .slice(0, 10)
      .map((p) => `${formatTs(p.ts)} → ${p.price.toFixed(2)}`)
      .join("\n");
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error("AI response missing content");
      return null;
    }

    return { model, reportMd: content };
  } catch (err) {
    console.error("AI API call failed:", err);
    return null;
  }
}

export async function getRecentPrices(
  db: D1Database,
  symbol: string,
  ts: number,
  minutes: number = 30,
): Promise<PricePoint[]> {
  const fromTs = ts - minutes * 60;
  const result = await db
    .prepare(
      "SELECT ts, price FROM prices WHERE symbol = ? AND ts >= ? AND ts <= ? ORDER BY ts DESC",
    )
    .bind(symbol, fromTs, ts)
    .all();

  return (result.results || []).map((r) => ({
    ts: r.ts as number,
    price: r.price as number,
  }));
}

export async function getDailyPrices(
  db: D1Database,
  symbol: string,
  days: number = 3,
): Promise<{ date: string; high: number; low: number; high_time: string; low_time: string }[]> {
  const result = await db
    .prepare(
      `SELECT day_ts, max_price, min_price, max_ts, min_ts
       FROM daily_prices 
       WHERE symbol = ? 
       ORDER BY day_ts DESC 
       LIMIT ?`,
    )
    .bind(symbol, days)
    .all();

  return (result.results || []).map((r) => {
    const dayTs = r.day_ts as number;
    const date = new Date(dayTs * 1000).toISOString().split('T')[0];
    const highTime = formatTs(r.max_ts as number);
    const lowTime = formatTs(r.min_ts as number);
    
    return {
      date,
      high: r.max_price as number,
      low: r.min_price as number,
      high_time: highTime,
      low_time: lowTime,
    };
  });
}
