import type { Env } from "../types";
import { jsonResponse } from "../utils/cors";

/**
 * GET /api/reports?limit=10&offset=0&from=ts1&to=ts2
 *
 * 查询 AI 分析报告，支持分页，默认最近 7 天，最多保留 360 天
 */
export async function handleGetReports(
  request: Request,
  env: Env,
  origin?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "") || 50,
    100,
  );
  const offset = parseInt(url.searchParams.get("offset") || "") || 0;
  const now = Math.floor(Date.now() / 1000);
  const from = parseInt(url.searchParams.get("from") || "") || now - 7 * 86400; // 默认 7 天
  const to = parseInt(url.searchParams.get("to") || "") || now;
  
  // 限制最多查询 360 天
  const maxFrom = now - 360 * 86400;
  const actualFrom = Math.max(from, maxFrom);

  const result = await env.DB.prepare(
    "SELECT id, ts, symbol, price, model, report_md, status, error FROM reports WHERE symbol = ? AND ts >= ? AND ts <= ? ORDER BY ts DESC LIMIT ? OFFSET ?",
  )
    .bind("AU", actualFrom, to, limit, offset)
    .all();

  return jsonResponse(result.results || [], origin);
}
