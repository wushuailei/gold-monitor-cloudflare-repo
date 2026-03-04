-- Migration: 0014 - Add alert_count to user_targets
ALTER TABLE user_targets ADD COLUMN alert_count INTEGER NOT NULL DEFAULT 0;

-- Update existing records to set alert_count = 0
UPDATE user_targets SET alert_count = 0 WHERE alert_count IS NULL;
