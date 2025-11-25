-- Add price_source column to quote_lines table
ALTER TABLE quote_lines ADD COLUMN IF NOT EXISTS price_source text;