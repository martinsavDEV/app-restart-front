-- Add price_reference column to price_items table for storing references like "MSA 2025"
ALTER TABLE price_items ADD COLUMN IF NOT EXISTS price_reference text DEFAULT 'MSA 2025';