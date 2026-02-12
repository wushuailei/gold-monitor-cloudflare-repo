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
  const icon = alertType === "RISE" ? "📈" : "📉";
  const typeLabel = alertType === "RISE" ? "涨幅" : "跌幅";
  const baseLabel = BASE_LABELS[baseType] || baseType;

  const lines = [`${icon} [AU 金价${typeLabel}提醒]`];
  lines.push(`当前价: ${priceNow.toFixed(2)}`);
  lines.push(`${baseLabel}: ${refPrice.toFixed(2)}`);
  lines.push(`${typeLabel}: ${Math.abs(changePercent).toFixed(2)}%`);
  lines.push(`节点等级: ${nodeLevel}级`);
  lines.push(`用户: ${createdBy}`);
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
  const lines = [`🎯 [AU 目标价提醒]`];
  lines.push(`目标价: ${targetPrice.toFixed(2)} (${cmpLabel})`);
  lines.push(`当前价: ${currentPrice.toFixed(2)}`);
  lines.push(`用户: ${createdBy}`);
  return lines.join("\n");
}

/**
 * 构造 AI 分析报告消息
 */
export function buildReportMessage(price: number, reportMd: string): string {
  return `[AU 金价 AI 分析]\n当前价: ${price.toFixed(2)}\n\n${reportMd}`;
}
