-- Add calculator_data column to quote_settings table
ALTER TABLE quote_settings 
ADD COLUMN calculator_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN quote_settings.calculator_data IS 'Stores calculator data including turbines, access segments, and design parameters';