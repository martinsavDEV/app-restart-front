-- Add header_comment column to lots table for lot-level notes
ALTER TABLE lots ADD COLUMN header_comment TEXT DEFAULT NULL;