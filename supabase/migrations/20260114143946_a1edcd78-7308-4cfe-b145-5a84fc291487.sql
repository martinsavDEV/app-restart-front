-- Add quantity_formula column to store calculation formulas
ALTER TABLE quote_lines
ADD COLUMN quantity_formula TEXT DEFAULT NULL;

COMMENT ON COLUMN quote_lines.quantity_formula IS 'Optional calculation formula for quantity (e.g., 23x150)';