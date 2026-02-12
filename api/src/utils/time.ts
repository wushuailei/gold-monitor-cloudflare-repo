/**
 * 时间对齐到分钟（秒级 Unix timestamp）
 */
export function alignToMinute(ms: number): number {
  return Math.floor(ms / 60000) * 60;
}

/**
 * 获取当前分钟对齐的 Unix timestamp（秒）
 */
export function nowTs(): number {
  return alignToMinute(Date.now());
}

/**
 * 格式化时间戳为可读字符串（北京时间）
 */
export function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
  });
}

export function nowDateOnly(): string {
  const d = new Date();
  return formatDate(d);
}

/**
 * 获取今日 00:00:00 (北京时间) 的秒级时间戳
 */
export function getTodayMidnightTs(): number {
  const now = Date.now();
  // 北京时间是 UTC+8，即偏移 8 小时 (28800000ms)
  // 将当前 UTC 时间加上偏移量，对一天 (86400000ms) 取整，得到“北京时间当天的0点”
  // 再减去偏移量，还原为 UTC 时间戳
  const offset = 8 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const todayStartMs = Math.floor((now + offset) / dayMs) * dayMs - offset;

  return Math.floor(todayStartMs / 1000);
}

/**
 * 获取昨日 00:00:00 (北京时间) 的秒级时间戳
 */
export function getYesterdayMidnightTs(): number {
  return getTodayMidnightTs() - 86400; // 减一天
}

export function subDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

function formatDate(d: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}
