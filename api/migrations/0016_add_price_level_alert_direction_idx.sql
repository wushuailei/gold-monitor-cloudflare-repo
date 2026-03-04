-- Migration: 0016 - Add price level alert direction index
CREATE INDEX idx_price_levels_direction_ts ON price_levels(direction, ts DESC);
