import type { Env } from "../types";

export interface PriceResult {
  price: number;
  xau: number;
  source: string;
}

/** 数据源域名 */
const SOURCE = "huangjinjiage.com.cn";

/**
 * 金价数据列定义
 * panjia 字符串以逗号分隔
 * index 1 = 国内今日金价（CNY/克）
 * index 33 = 国际金价（USD/盎司）
 */
const CN_JRJJ_INDEX = 1;
const US_MGHJ_INDEX = 33;

/**
 * 拉取 AU 金价（国内今日金价，CNY/克）
 *
 * 数据来源：huangjinjiage.com.cn 的 panjia1.js
 * 响应格式：JS 变量赋值，内含逗号分隔的报价数据
 * 示例：const panjia = "begin,1122.22,1124.22,...,end"
 *
 * 取 index 1（cn_jrjj）作为国内今日金价
 */
export async function fetchGoldPrice(_env: Env): Promise<PriceResult | null> {
  const url = `http://res.huangjinjiage.com.cn/panjia1.js?t=${Date.now()}`;

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "http://www.huangjinjiage.com.cn/",
      },
    });

    if (!resp.ok) {
      return null;
    }

    const text = await resp.text();
    return parsePanjia(text);
  } catch (err) {
    return null;
  }
}

/**
 * 从 panjia JS 响应中解析金价
 * 按逗号分割后取目标索引
 */
function parsePanjia(raw: string): PriceResult | null {
  const cnQuote = raw?.split(",") || [];

  const raw_price = cnQuote[CN_JRJJ_INDEX];
  const raw_xau = cnQuote[US_MGHJ_INDEX];

  let price = parseFloat(raw_price || "0");
  let xau = parseFloat(raw_xau || "0");
  if (isNaN(price) || isNaN(xau)) {
    return null;
  }

  return { price, xau, source: SOURCE };
}
