import type { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/cors";
import { sendFeishu } from "../services/feishu";
import { sendDailyReport } from "../scheduled/dailyReport";
import { nowTs } from "../utils/time";

/**
 * POST /api/test/feishu
 * 
 * 测试飞书消息发送
 */
export async function handleTestFeishu(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  if (!env.FEISHU_WEBHOOK) {
    return errorResponse("FEISHU_WEBHOOK not configured", origin, 400);
  }

  const testMessage = `🧪 [测试消息]\n时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}\n这是一条测试消息，用于验证飞书机器人配置是否正确。`;

  try {
    const sent = await sendFeishu(env.FEISHU_WEBHOOK, testMessage);
    
    if (sent) {
      return jsonResponse({ 
        success: true, 
        message: "测试消息已发送到飞书群" 
      }, origin);
    } else {
      return errorResponse("发送失败，请检查 FEISHU_WEBHOOK 配置", origin, 500);
    }
  } catch (err) {
    console.error("Test Feishu failed:", err);
    return errorResponse("发送失败: " + String(err), origin, 500);
  }
}

/**
 * POST /api/test/alert
 * 
 * 测试告警消息发送
 */
export async function handleTestAlert(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  if (!env.FEISHU_WEBHOOK) {
    return errorResponse("FEISHU_WEBHOOK not configured", origin, 400);
  }

  // 模拟告警数据
  const mockPrice = 580.50;
  const mockRefPrice = 575.00;
  const mockChangePercent = ((mockPrice - mockRefPrice) / mockRefPrice) * 100;

  const alertMessage = `📈 [AU 金价涨幅提醒]\n当前价: ${mockPrice.toFixed(2)}\n昨日收盘价: ${mockRefPrice.toFixed(2)}\n涨幅: ${mockChangePercent.toFixed(2)}%\n节点等级: 2级\n用户: 测试用户\n\n⚠️ 这是一条测试告警消息`;

  try {
    const sent = await sendFeishu(env.FEISHU_WEBHOOK, alertMessage);
    
    if (sent) {
      return jsonResponse({ 
        success: true, 
        message: "测试告警消息已发送到飞书群" 
      }, origin);
    } else {
      return errorResponse("发送失败，请检查 FEISHU_WEBHOOK 配置", origin, 500);
    }
  } catch (err) {
    console.error("Test alert failed:", err);
    return errorResponse("发送失败: " + String(err), origin, 500);
  }
}

/**
 * POST /api/test/daily-report
 * 
 * 测试 AI 分析报告生成和发送
 */
export async function handleTestDailyReport(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  if (!env.FEISHU_WEBHOOK) {
    return errorResponse("FEISHU_WEBHOOK not configured", origin, 400);
  }

  if (!env.AI_API_KEY || !env.AI_API_URL) {
    return errorResponse("AI_API_KEY or AI_API_URL not configured", origin, 400);
  }

  try {
    const ts = nowTs();
    const symbol = "AU";

    // 调用每日早报函数
    await sendDailyReport(env, ts, symbol);

    return jsonResponse({ 
      success: true, 
      message: "AI 分析报告已生成并发送到飞书群，同时保存到数据库" 
    }, origin);
  } catch (err) {
    console.error("Test daily report failed:", err);
    return errorResponse("生成报告失败: " + String(err), origin, 500);
  }
}
