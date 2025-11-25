-- Add linked_field column to quote_sections to support automatic linking
-- This will store the name of the field from quote_settings that this section's multiplier is linked to
-- Example: 'n_wtg' means the multiplier automatically follows the n_wtg value
ALTER TABLE quote_sections ADD COLUMN linked_field TEXT;

-- Add comment for documentation
COMMENT ON COLUMN quote_sections.linked_field IS 'Name of the field from quote_settings that this section multiplier is linked to (e.g., n_wtg)';