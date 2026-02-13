import type { Env } from "../types";
import { sendFeishu, buildTargetMessage } from "../services/feishu";

interface TargetConfig {
  id: number;
  symbol: string;
  target_price: number;
  target_alert: number;
  target_cmp: string; // 'EQ' | 'GTE' | 'LTE'
}

/**
 * 检查目标价提醒
 *
 * 从 user_targets 表读取 target_price / target_cmp / target_alert 配置
 * 对比方式：
 *   EQ  → |priceNow - target| <= 0.01
 *   GTE → priceNow >= target
 *   LTE → priceNow <= target
 *
 * 触发后：
 *   - target_alert 设为 0（仅触发一次）
 *   - 写入 alerts 表（alert_type='TARGET', base_type='TARGET', node_level=0）
 *   - 发送飞书通知
 */
export async function checkTargets(
  env: Env,
  priceNow: number,
  ts: number,
  symbol: string,
): Promise<void> {
  // 查询所有开启目标价提醒的配置
  const result = await env.DB.prepare(
    `SELECT id, symbol, target_price, target_alert, target_cmp
     FROM user_targets
     WHERE symbol = ? AND target_alert = 1`,
  )
    .bind(symbol)
    .all<TargetConfig>();

  const targets = result.results || [];
  if (targets.length === 0) return;

  for (const t of targets) {
    const hit = checkCmp(priceNow, t.target_price, t.target_cmp);
    if (!hit) continue;

    // 发送飞书通知
    let status = "SENT";
    let error: string | null = null;

    if (env.FEISHU_WEBHOOK) {
      const msg = buildTargetMessage(
        t.target_price,
        t.target_cmp,
        priceNow,
        "user",
      );
      const ok = await sendFeishu(env.FEISHU_WEBHOOK, msg);
      if (!ok) {
        status = "FAILED";
        error = "Feishu webhook failed";
      }
    } else {
      status = "FAILED";
      error = "FEISHU_WEBHOOK not configured";
    }

    // 写入 alerts + 关闭提醒（batch）
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO alerts (ts, symbol, created_by, alert_type, base_type, node_level, price, ref_price, change_percent, status, error)
         VALUES (?, ?, 'user', 'TARGET', 'TARGET', 0, ?, ?, NULL, ?, ?)`,
      ).bind(ts, symbol, priceNow, t.target_price, status, error),
      env.DB.prepare(
        `UPDATE user_targets SET target_alert = 0 WHERE id = ?`,
      ).bind(t.id),
    ]);

    console.log(
      `[TargetCheck] target=${t.target_price} cmp=${t.target_cmp} price=${priceNow} → ${status}`,
    );
  }
}

/**
 * 比较操作符匹配
 */
function checkCmp(priceNow: number, targetPrice: number, cmp: string): boolean {
  switch (cmp) {
    case "EQ":
      return Math.abs(priceNow - targetPrice) <= 0.01;
    case "GTE":
      return priceNow >= targetPrice;
    case "LTE":
      return priceNow <= targetPrice;
    default:
      return priceNow >= targetPrice; // 默认 GTE
  }
}
