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
  lot_id?: number; // 卖出时关联的买入批次 id
  realized_pnl?: number; // 卖出时的已实现盈亏
}

export interface HoldingLot {
  id: number;
  symbol: string;
  bought_ts: number;
  cost_price: number;
  qty: number; // 剩余克数
  note?: string | null;
}

export interface Holding {
  symbol: string;
  lots: HoldingLot[];
  total_qty: number;
  total_cost: number;
  avg_price: number;
  realized_profit: number;
  updated_ts: number;
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
  open_price?: number;
  open_ts?: number;
  close_price?: number;
  close_ts?: number;
  max_price: number;
  min_price: number;
  max_ts: number;
  min_ts: number;
  last_updated: number;
}

export interface PriceLevel {
  id: number;
  ts: number;
  symbol: string;
  price_level: number;
  direction: string; // UP/DOWN
  price: number;
  status?: string;
  error?: string;
}
