export interface PricePoint {
  id: number;
  symbol: string;
  ts: number;
  price: number;
  xau_price: number;
  source?: string;
  meta?: string;
}

export interface Trade {
  id: number;
  ts: number;
  symbol: string;
  side: string; // 买/卖
  price: number;
  qty?: number;
  note?: string;
}

export interface Report {
  id: number;
  ts: number;
  symbol: string;
  alert_id?: number;
  price?: number;
  context?: string;
  model: string;
  report_md: string;
  status?: string;
  error?: string;
}

export interface Alert {
  id: number;
  ts: number;
  symbol: string;
  created_by: string;
  alert_type: string; // TARGET/RISE/FALL
  base_type: string; // TARGET/YESTERDAY/BUY
  node_level: number; // 0/1/2/3
  price: number;
  ref_price?: number;
  change_percent?: number;
  status?: string;
  error?: string;
}

export interface UserConfig {
  id: number;
  symbol: string;
  created_by: string;
  target_price?: number;
  target_alert: number; // 0/1
  target_cmp: string; // EQ/GTE/LTE
  rise_1?: number;
  rise_2?: number;
  rise_3?: number;
  fall_1?: number;
  fall_2?: number;
  fall_3?: number;
  created_ts: number;
}

export interface DailyPrice {
  id: number;
  symbol: string;
  day_ts: number;
  max_price: number;
  min_price: number;
  max_ts: number;
  min_ts: number;
  last_updated: number;
}
