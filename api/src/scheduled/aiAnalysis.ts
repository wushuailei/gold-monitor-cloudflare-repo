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

  const systemPrompt = `你是一位专业的黄金市场分析师。请根据提供的实时金价数据，用中文输出简洁的 Markdown 格式分析报告。

报告必须包含以下三个部分：
## 可能原因
分析本次异常跌幅的可能原因（1-3 条）

## 短线风险
评估短线（未来 1-4 小时）的风险等级和走势判断

## 操作建议
分别给出三种策略：
- **保守**: 适合风险厌恶型
- **中性**: 适合普通投资者
- **激进**: 适合短线交易者

注意：保持客观，避免过度自信的预测。`;

  const userPrompt = `当前时间: ${formatTs(Math.floor(Date.now() / 1000))}

品种: ${input.symbol}
当前价: ${input.priceNow.toFixed(2)}
1分钟跌幅: ${input.change1m !== null ? input.change1m.toFixed(2) + "%" : "无数据"}
5分钟跌幅: ${input.change5m !== null ? input.change5m.toFixed(2) + "%" : "无数据"}

最近价格序列（最新在前）:
${input.recentPrices.map((p) => `${formatTs(p.ts)} → ${p.price.toFixed(2)}`).join("\n")}`;

  try {
    const resp = await fetch(env.AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      console.error(
        `AI API responded with ${resp.status}: ${await resp.text()}`,
      );
      return null;
    }

    const data: any = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error(
        "AI response missing content:",
        JSON.stringify(data).slice(0, 200),
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
