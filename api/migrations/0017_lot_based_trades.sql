-- Migration: 0017 - 批次持仓模型
--
-- 决策：清空旧的交易记录与持仓数据，从干净状态开始。
-- trades 增加批次字段，每笔买入即一个持仓批次：
--   - lot_id        卖出流水关联的买入批次 id
--   - realized_pnl  卖出流水已实现盈亏 = (卖出价 - 批次成本价) * 克数
--   - remaining_qty 买入批次剩余克数（卖出时递减）
-- holdings 表不再作为数据源（保留空表避免破坏引用），持仓由 trades 聚合得出。

DELETE FROM trades;
DELETE FROM holdings;

ALTER TABLE trades ADD COLUMN lot_id INTEGER;
ALTER TABLE trades ADD COLUMN realized_pnl REAL;
ALTER TABLE trades ADD COLUMN remaining_qty REAL;
