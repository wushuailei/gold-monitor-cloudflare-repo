export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  FEISHU_WEBHOOK: string;
  CORS_ORIGIN?: string;
  AI_API_KEY?: string;
  AI_API_URL?: string;
  AI_MODEL?: string;
  REQUIRE_REFERER?: string;
  ALLOWED_ORIGINS?: string;
}
