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

/**
 * 调用 AI API 生成分析报告
 *
 * 使用 OpenAI 兼容接口（支持 OpenAI / DeepSeek / 其他兼容服务）
 * 通过 AI_API_URL + AI_API_KEY + AI_MODEL 环境变量配置
 */
export async function generateReport(
  env: Env,
  input: AnalysisInput,
): Promise<{ model: string; reportMd: string } | null> {
  if (!env.AI_API_KEY || !env.AI_API_URL) {
    console.error("AI_API_KEY or AI_API_URL not configured");
    return null;
  }

  const model = env.AI_MODEL || "gpt-4o-mini";

  const systemPrompt = `你是一位专业的黄金市场分析师。请根据提供的实时金价数据和历史日线数据，用中文输出简洁的 Markdown 格式分析报告。

报告必须包含以下三个部分：
## 市场回顾
简要分析过去三天的价格走势和关键变化（2-3 条）

## 未来三天展望
评估未来三天的风险等级和可能走势，包括：
- 风险等级：低/中/高
- 支撑位和阻力位预测
- 关键影响因素

## 操作建议
分别给出三种策略：
- **保守**: 适合风险厌恶型投资者
- **中性**: 适合普通投资者
- **激进**: 适合短线交易者

注意：保持客观，避免过度自信的预测。`;

  let userPrompt = `当前时间: ${formatTs(Math.floor(Date.now() / 1000))}

品种: ${input.symbol}
当前价: ${input.priceNow.toFixed(2)} 元/克`;

  // 添加日线数据（如果有）
  if (input.dailyPrices && input.dailyPrices.length > 0) {
    userPrompt += `\n\n过去三天日线数据：\n`;
    input.dailyPrices.forEach((day) => {
      userPrompt += `${day.date}: 最高${day.high.toFixed(2)}(${day.high_time}) 最低${day.low.toFixed(2)}(${day.low_time}) 波动${((day.high - day.low) / day.low * 100).toFixed(2)}%\n`;
    });
  }

  // 添加短期变化数据
  if (input.change1m !== null || input.change5m !== null) {
    userPrompt += `\n短期变化：\n`;
    if (input.change1m !== null) {
      userPrompt += `1分钟: ${input.change1m.toFixed(2)}%\n`;
    }
    if (input.change5m !== null) {
      userPrompt += `5分钟: ${input.change5m.toFixed(2)}%\n`;
    }
  }

  // 添加最近价格序列
  if (input.recentPrices.length > 0) {
    userPrompt += `\n最近价格序列（最新在前）:\n`;
    userPrompt += input.recentPrices
      .slice(0, 10) // 只显示最近10条
      .map((p) => `${formatTs(p.ts)} → ${p.price.toFixed(2)}`)
      .join("\n");
  }

  try {
    // 火山引擎使用标准 OpenAI 格式
    const requestBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    const resp = await fetch(env.AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      console.error(
        `AI API responded with ${resp.status}: ${await resp.text()}`,
      );
      return null;
    }

    const data: any = await resp.json();
    
    // 兼容不同 API 的响应格式
    let content: string | null = null;
    
    // 标准 OpenAI 格式
    if (data?.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content;
    }
    // 火山引擎格式（可能使用 output 字段）
    else if (data?.output?.text) {
      content = data.output.text;
    }
    // 其他可能的格式
    else if (data?.result) {
      content = data.result;
    }
    
    if (!content) {
      console.error(
        "AI response missing content:",
        JSON.stringify(data).slice(0, 500),
      );
      return null;
    }

    return { model, reportMd: content };
  } catch (err) {
    console.error("AI API call failed:", err);
    return null;
  }
}

/**
 * 查询最近 N 分钟的价格序列（用于 AI 输入）
 */
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

/**
 * 获取最近 N 天的日线数据（用于 AI 输入）
 */
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
    const date = new Date(dayTs * 1000).toISOString().split('T')[0]; // YYYY-MM-DD
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
