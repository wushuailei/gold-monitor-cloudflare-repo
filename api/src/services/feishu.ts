import { formatTs } from "../utils/time";

/**
 * 发送飞书群机器人消息（text 类型）
 */
export async function sendFeishu(
  webhookUrl: string,
  text: string,
): Promise<boolean> {
  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "text",
        content: { text },
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

const BASE_LABELS: Record<string, string> = {
  YESTERDAY: "昨日收盘价",
  BUY: "买入价",
};

const CMP_LABELS: Record<string, string> = {
  EQ: "等于",
  GTE: "大于等于",
  LTE: "小于等于",
};

/**
 * 构造涨跌幅节点告警消息
 */
export function buildNodeAlertMessage(
  priceNow: number,
  refPrice: number,
  changePercent: number,
  alertType: string,
  baseType: string,
  nodeLevel: number,
  createdBy: string,
): string {
  const icon = alertType === "RISE" ? "�" : "�";
  const arrow = alertType === "RISE" ? "⬆️" : "⬇️";
  const typeLabel = alertType === "RISE" ? "涨幅" : "跌幅";
  const baseLabel = BASE_LABELS[baseType] || baseType;

  const lines = [
    `${icon}${icon}${icon} 【金价${typeLabel}节点】 ${icon}${icon}${icon}`,
    ``,
    `${arrow} 当前价格: ¥${priceNow.toFixed(2)}`,
    `📊 ${baseLabel}: ¥${refPrice.toFixed(2)}`,
    `📈 ${typeLabel}: ${Math.abs(changePercent).toFixed(2)}%`,
    `⚡ 节点等级: ${nodeLevel}级`,
    `👤 用户: ${createdBy}`,
    ``,
    `⏰ ${formatTs(Math.floor(Date.now() / 1000))}`,
  ];
  return lines.join("\n");
}

/**
 * 构造目标价触发消息
 */
export function buildTargetMessage(
  targetPrice: number,
  cmp: string,
  currentPrice: number,
  createdBy: string,
): string {
  const cmpLabel = CMP_LABELS[cmp] || cmp;
  const diff = currentPrice - targetPrice;
  const diffStr = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
  
  const lines = [
    `🎯🎯🎯 【目标价触发】 🎯🎯🎯`,
    ``,
    `📍 目标价格: ¥${targetPrice.toFixed(2)}`,
    `📐 触发条件: ${cmpLabel}`,
    `💰 当前价格: ¥${currentPrice.toFixed(2)}`,
    `📊 偏离幅度: ¥${diffStr}`,
    `👤 用户: ${createdBy}`,
    ``,
    `⏰ ${formatTs(Math.floor(Date.now() / 1000))}`,
  ];
  return lines.join("\n");
}

/**
 * 构造 AI 分析报告消息
 */
export function buildReportMessage(price: number, reportMd: string): string {
  const lines = [
    `🤖🤖🤖 【AI 每日分析】 🤖🤖🤖`,
    ``,
    `💰 当前金价: ¥${price.toFixed(2)}`,
    ``,
    `${reportMd}`,
  ];
  return lines.join("\n");
}

/**
 * 构造整数关口突破/跌破消息
 */
export function buildPriceLevelMessage(
  level: number,
  direction: string,
  currentPrice: number,
  symbol: string,
): string {
  const isUp = direction === "UP";
  const icon = isUp ? "�" : "�";
  const arrow = isUp ? "⬆️" : "⬇️";
  const action = isUp ? "突破" : "跌破";
  const barrier = isUp ? "━━━⬆️━━━" : "━━━⬇️━━━";
  
  const lines = [
    `${icon}${icon}${icon} 【关口${action}】 ${icon}${icon}${icon}`,
    ``,
    `${barrier}`,
    `   ¥${level} 整数关口`,
    `${barrier}`,
    ``,
    `${arrow} 当前价格: ¥${currentPrice.toFixed(2)}`,
    `📍 品种: ${symbol}`,
    ``,
    `⏰ ${formatTs(Math.floor(Date.now() / 1000))}`,
  ];
  return lines.join("\n");
}
