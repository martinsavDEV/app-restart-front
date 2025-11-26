-- Remove unique constraint on code to allow multiple templates per lot
ALTER TABLE lot_templates DROP CONSTRAINT IF EXISTS lot_templates_code_key;