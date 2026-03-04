import { format } from 'date-fns';

// 将 UTC 时间戳转换为北京时间时间戳（加8小时）
export const utcToBeijingTs = (utcTs: number): number => {
  return utcTs + 8 * 3600; // 8小时 = 28800秒
};

// 将 UTC 时间戳格式化为北京时间字符串
export const formatBeijingDate = (utcTs: number, formatStr: string): string => {
  const beijingTs = utcToBeijingTs(utcTs);
  return format(new Date(beijingTs * 1000), formatStr);
};
