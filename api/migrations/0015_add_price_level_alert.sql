-- Migration: 0015 - Add price level alert support
-- Add last_check_price to global_configs
ALTER TABLE global_configs ADD COLUMN last_check_price REAL;

-- Create price_levels table for recording level crossings
CREATE TABLE IF NOT EXISTS price_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  price_level INTEGER NOT NULL,
  direction TEXT NOT NULL,
  price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT',
  error TEXT
);

CREATE INDEX idx_price_levels_symbol_ts ON price_levels(symbol, ts);
CREATE INDEX idx_price_levels_ts ON price_levels(ts);
CREATE INDEX idx_price_levels_direction_ts ON price_levels(direction, ts DESC);
