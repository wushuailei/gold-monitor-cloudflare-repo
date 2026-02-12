import type { Env } from "../types";
import { sendFeishu, buildNodeAlertMessage } from "../services/feishu";
import { getTodayMidnightTs, getYesterdayMidnightTs } from "../utils/time";

/** 涨跌类型 */
export type AlertType = "RISE" | "FALL";
/** 对比基准 */
export type BaseType = "YESTERDAY" | "BUY";
/** 节点等级 1/2/3 */
export type NodeLevel = 1 | 2 | 3;

interface TriggeredNode {
  alertType: AlertType;
  baseType: BaseType;
  nodeLevel: NodeLevel;
  changePercent: number;
  refPrice: number;
}

interface UserConfig {
  id: number;
  symbol: string;
  created_by: string;
  rise_1: number | null;
  rise_2: number | null;
  rise_3: number | null;
  fall_1: number | null;
  fall_2: number | null;
  fall_3: number | null;
}

// ─── 查询辅助 ────────────────────────────────────────────────

/**
 * 获取昨日收盘价（昨日最后一条价格记录）
 */
export async function getYesterdayClose(
  db: D1Database,
  symbol: string,
): Promise<number | null> {
  const yesterdayStart = getYesterdayMidnightTs();
  const todayStart = getTodayMidnightTs();

  const row = await db
    .prepare(
      `SELECT price FROM prices WHERE symbol = ? AND ts >= ? AND ts < ? ORDER BY ts DESC LIMIT 1`,
    )
    .bind(symbol, yesterdayStart, todayStart)
    .first<{ price: number }>();

  return row?.price ?? null;
}

/**
 * 获取未平仓买入价（最近一笔 BUY 且之后无 SELL）
 */
export async function getActiveBuyPrice(
  db: D1Database,
  symbol: string,
): Promise<number | null> {
  const row = await db
    .prepare(
      `SELECT price FROM trades
       WHERE symbol = ? AND side = 'BUY'
         AND ts > COALESCE(
           (SELECT MAX(ts) FROM trades WHERE symbol = ? AND side = 'SELL'), 0
         )
       ORDER BY ts DESC LIMIT 1`,
    )
    .bind(symbol, symbol)
    .first<{ price: number }>();

  return row?.price ?? null;
}

// ─── 涨跌幅检测 ──────────────────────────────────────────────

/**
 * 检查当前价格是否触发配置的涨跌幅节点
 *
 * riseNodes / fallNodes 是用户配置的三个节点值（百分比，正数）
 * 返回所有触发的节点列表（已按 level 去重）
 */
export function checkNodes(
  priceNow: number,
  refPrice: number,
  baseType: BaseType,
  riseNodes: (number | null)[],
  fallNodes: (number | null)[],
): TriggeredNode[] {
  if (refPrice <= 0) return [];

  const changePercent = ((priceNow - refPrice) / refPrice) * 100;
  const triggered: TriggeredNode[] = [];

  // 涨幅检查：changePercent > 0 且 >= 节点阈值
  if (changePercent > 0) {
    // 去重：用 Set 收集不重复的阈值
    const seen = new Set<number>();
    riseNodes.forEach((threshold, idx) => {
      if (threshold !== null && threshold > 0 && !seen.has(threshold)) {
        seen.add(threshold);
        if (changePercent >= threshold) {
          triggered.push({
            alertType: "RISE",
            baseType,
            nodeLevel: (idx + 1) as NodeLevel,
            changePercent,
            refPrice,
          });
        }
      }
    });
  }

  // 跌幅检查：changePercent < 0 且绝对值 >= 节点阈值
  if (changePercent < 0) {
    const absChange = Math.abs(changePercent);
    const seen = new Set<number>();
    fallNodes.forEach((threshold, idx) => {
      if (threshold !== null && threshold > 0 && !seen.has(threshold)) {
        seen.add(threshold);
        if (absChange >= threshold) {
          triggered.push({
            alertType: "FALL",
            baseType,
            nodeLevel: (idx + 1) as NodeLevel,
            changePercent,
            refPrice,
          });
        }
      }
    });
  }

  return triggered;
}

// ─── 去重：查询当日已发送次数 ────────────────────────────────

/**
 * 查询某节点当日已发送的告警次数
 */
async function getTodayAlertCount(
  db: D1Database,
  symbol: string,
  createdBy: string,
  alertType: AlertType,
  baseType: BaseType,
  nodeLevel: NodeLevel,
  todayTs: number,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as cnt FROM alerts
       WHERE symbol = ? AND created_by = ? AND alert_type = ? AND base_type = ?
         AND node_level = ? AND ts >= ?`,
    )
    .bind(symbol, createdBy, alertType, baseType, nodeLevel, todayTs)
    .first<{ cnt: number }>();

  return row?.cnt ?? 0;
}

// ─── 主流程 ──────────────────────────────────────────────────

/**
 * 告警引擎主入口
 *
 * 1. 查 user_configs 获取每个用户的涨跌节点配置
 * 2. 查昨日收盘价 + 未平仓买入价
 * 3. 对每种基准分别 checkNodes
 * 4. 去重判断后发送飞书 + 写入 alerts 记录
 */
export async function runAlertEngine(
  env: Env,
  priceNow: number,
  ts: number,
  symbol: string,
): Promise<void> {
  const todayTs = getTodayMidnightTs();

  // 1. 查询所有用户配置
  const configsResult = await env.DB.prepare(
    `SELECT id, symbol, created_by, rise_1, rise_2, rise_3, fall_1, fall_2, fall_3
     FROM user_configs WHERE symbol = ?`,
  )
    .bind(symbol)
    .all<UserConfig>();

  const configs = configsResult.results || [];
  if (configs.length === 0) return;

  // 2. 查询参考价格（所有用户共用）
  const [yesterdayClose, activeBuyPrice] = await Promise.all([
    getYesterdayClose(env.DB, symbol),
    getActiveBuyPrice(env.DB, symbol),
  ]);

  console.log(
    `[AlertEngine] yesterdayClose=${yesterdayClose} activeBuyPrice=${activeBuyPrice}`,
  );

  if (yesterdayClose === null && activeBuyPrice === null) return;

  // 3. 遍历每个用户的配置
  for (const cfg of configs) {
    const riseNodes = [cfg.rise_1, cfg.rise_2, cfg.rise_3];
    const fallNodes = [cfg.fall_1, cfg.fall_2, cfg.fall_3];

    // 收集两种基准下的触发节点
    const allTriggered: TriggeredNode[] = [];

    if (yesterdayClose !== null) {
      allTriggered.push(
        ...checkNodes(
          priceNow,
          yesterdayClose,
          "YESTERDAY",
          riseNodes,
          fallNodes,
        ),
      );
    }

    if (activeBuyPrice !== null) {
      allTriggered.push(
        ...checkNodes(priceNow, activeBuyPrice, "BUY", riseNodes, fallNodes),
      );
    }

    if (allTriggered.length === 0) continue;

    // 4. 逐节点去重并发送
    for (const node of allTriggered) {
      const maxSendCount = node.nodeLevel; // 1级→1次, 2级→2次, 3级→3次
      const sentCount = await getTodayAlertCount(
        env.DB,
        symbol,
        cfg.created_by,
        node.alertType,
        node.baseType,
        node.nodeLevel,
        todayTs,
      );

      if (sentCount >= maxSendCount) continue;

      // 发送飞书
      let status = "SENT";
      let error: string | null = null;

      if (env.FEISHU_WEBHOOK) {
        const msg = buildNodeAlertMessage(
          priceNow,
          node.refPrice,
          node.changePercent,
          node.alertType,
          node.baseType,
          node.nodeLevel,
          cfg.created_by,
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

      // 写入 alerts 记录
      await env.DB.prepare(
        `INSERT INTO alerts (ts, symbol, created_by, alert_type, base_type, node_level, price, ref_price, change_percent, status, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          ts,
          symbol,
          cfg.created_by,
          node.alertType,
          node.baseType,
          node.nodeLevel,
          priceNow,
          node.refPrice,
          node.changePercent,
          status,
          error,
        )
        .run();

      console.log(
        `[AlertEngine] ${cfg.created_by}: ${node.alertType} L${node.nodeLevel} (${node.baseType}) ${node.changePercent.toFixed(2)}% → ${status}`,
      );
    }
  }
}
