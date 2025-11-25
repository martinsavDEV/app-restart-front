-- Add n_foundations field to quote_settings
ALTER TABLE public.quote_settings
ADD COLUMN IF NOT EXISTS n_foundations integer NOT NULL DEFAULT 1;