-- Add is_starred column to quote_versions
ALTER TABLE public.quote_versions ADD COLUMN is_starred boolean NOT NULL DEFAULT false;