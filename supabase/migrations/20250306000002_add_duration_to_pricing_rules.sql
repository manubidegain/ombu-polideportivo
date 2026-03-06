-- Add duration_minutes field to pricing_rules table
ALTER TABLE pricing_rules
ADD COLUMN duration_minutes INTEGER;

-- Add comment explaining the field
COMMENT ON COLUMN pricing_rules.duration_minutes IS 'Optional duration filter in minutes (e.g., 60, 90). If null, applies to all durations.';
