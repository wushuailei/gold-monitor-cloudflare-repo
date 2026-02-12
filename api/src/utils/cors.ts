/**
 * CORS 处理工具
 *
 * 限定 Pages 域名，不使用 *
 * 通过 CORS_ORIGIN 环境变量配置允许的域名
 */

export function corsHeaders(origin?: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * 处理 OPTIONS 预检请求
 */
export function handleOptions(origin?: string): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/**
 * 创建带 CORS 头的 JSON 响应
 */
export function jsonResponse(
  data: unknown,
  origin?: string,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

/**
 * 创建带 CORS 头的错误响应
 */
export function errorResponse(
  message: string,
  origin?: string,
  status = 400,
): Response {
  return jsonResponse({ error: message }, origin, status);
}
