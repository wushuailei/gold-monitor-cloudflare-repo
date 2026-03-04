import type { Env } from "../types";
import { sendFeishu, buildPriceLevelMessage } from "../services/feishu";

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

  if (Math.abs(priceNow - lastPrice) < PRICE_LEVEL_STEP) {
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
    for (let level = prevLevel - PRICE_LEVEL_STEP; level >= currLevel; level -= PRICE_LEVEL_STEP) {
      alerts.push({ level, direction: "DOWN" });
    }
  }

  if (alerts.length === 0) {
    await env.DB.prepare(
      "UPDATE global_configs SET last_check_price = ?, updated_ts = ? WHERE symbol = ?",
    )
      .bind(priceNow, ts, symbol)
      .run();
    return;
  }

  if (alerts.length > MAX_ALERTS_PER_CHECK) {
    console.error(
      `[PriceLevel] Too many alerts (${alerts.length}), skipping. prevLevel=${prevLevel}, currLevel=${currLevel}`
    );
    await env.DB.prepare(
      "UPDATE global_configs SET last_check_price = ?, updated_ts = ? WHERE symbol = ?",
    )
      .bind(priceNow, ts, symbol)
      .run();
    return;
  }

  for (const alert of alerts) {
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
