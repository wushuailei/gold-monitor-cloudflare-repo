import type { Env } from "../types";
import { sendFeishu, buildPriceLevelMessage } from "../services/feishu";

const PRICE_DIFF_THRESHOLD = 5;
const PRICE_LEVEL_STEP = 10;
const MAX_ALERTS_PER_CHECK = 30;

/**
 * 检查整数关口突破/跌破
 *
 * 每次跨越关口都提醒，不管之前是否触发过
 * 例如：1100 → 1180 会提醒 1110, 1120, 1130, 1140, 1150, 1160, 1170, 1180
 * 单次最多告警 MAX_ALERTS_PER_CHECK 个关口
 */
export async function checkPriceLevels(
  env: Env,
  priceNow: number,
  ts: number,
  symbol: string,
): Promise<void> {
  const globalConfig = await env.DB.prepare(
    "SELECT last_check_price FROM global_configs WHERE symbol = ?",
  )
    .bind(symbol)
    .first<{ last_check_price: number | null }>();

  const lastPrice = globalConfig?.last_check_price;

  if (lastPrice == null) {
    await env.DB.prepare(
      "UPDATE global_configs SET last_check_price = ?, updated_ts = ? WHERE symbol = ?",
    )
      .bind(priceNow, ts, symbol)
      .run();
    return;
  }

  if (Math.abs(priceNow - lastPrice) < PRICE_DIFF_THRESHOLD) {
    return;
  }

  const prevLevel = Math.floor(lastPrice / PRICE_LEVEL_STEP) * PRICE_LEVEL_STEP;
  const currLevel = Math.floor(priceNow / PRICE_LEVEL_STEP) * PRICE_LEVEL_STEP;

  const alerts: { level: number; direction: string }[] = [];

  if (priceNow > lastPrice) {
    for (let level = prevLevel + PRICE_LEVEL_STEP; level <= currLevel; level += PRICE_LEVEL_STEP) {
      alerts.push({ level, direction: "UP" });
    }
  } else if (priceNow < lastPrice) {
    for (let level = prevLevel - PRICE_LEVEL_STEP; level > currLevel; level -= PRICE_LEVEL_STEP) {
      alerts.push({ level, direction: "DOWN" });
    }
  }

  if (alerts.length === 0) {
    return;
  }

  // 查询最近 5 条记录，避免重复告警同一关口
  const recentRecords = await env.DB.prepare(
    "SELECT price_level FROM price_levels WHERE symbol = ? ORDER BY ts DESC LIMIT 5",
  )
    .bind(symbol)
    .all<{ price_level: number }>();

  const recentLevels = new Set<number>();
  for (const r of recentRecords.results || []) {
    recentLevels.add(r.price_level);
  }
  const recentLevel = recentLevels.size === 1 ? [...recentLevels][0] : null;

  // 过滤掉最近已告警的关口
  const filteredAlerts = alerts.filter((a) => a.level !== recentLevel);

  if (filteredAlerts.length === 0) {
    console.log("[PriceLevel] All alerts filtered, skipping duplicate levels");
    return;
  }

  let finalAlerts: { level: number; direction: string }[] = filteredAlerts;

  if (filteredAlerts.length > MAX_ALERTS_PER_CHECK) {
    const first5 = filteredAlerts.slice(0, 5);
    const last5 = filteredAlerts.slice(-5);
    finalAlerts = [...first5, ...last5];
    console.log(
      `[PriceLevel] Too many alerts (${filteredAlerts.length}), sending first 5 and last 5. prevLevel=${prevLevel}, currLevel=${currLevel}`
    );
  }

  for (const alert of finalAlerts) {
    let status = "SENT";
    let error: string | null = null;

    if (env.FEISHU_WEBHOOK) {
      const msg = buildPriceLevelMessage(
        alert.level,
        alert.direction,
        priceNow,
        symbol,
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

    await env.DB.prepare(
      `INSERT INTO price_levels (ts, symbol, price_level, direction, price, status, error)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(ts, symbol, alert.level, alert.direction, priceNow, status, error)
      .run();

    console.log(
      `[PriceLevel] level=${alert.level} direction=${alert.direction} price=${priceNow} → ${status}`,
    );
  }

  await env.DB.prepare(
    "UPDATE global_configs SET last_check_price = ?, updated_ts = ? WHERE symbol = ?",
  )
    .bind(priceNow, ts, symbol)
    .run();
}
