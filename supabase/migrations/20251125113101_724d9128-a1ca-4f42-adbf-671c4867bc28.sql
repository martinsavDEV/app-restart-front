-- Table pour les lots de chiffrage (catégories de travaux)
CREATE TABLE public.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_version_id uuid NOT NULL REFERENCES public.quote_versions(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table pour les lignes de chiffrage (BPU)
CREATE TABLE public.quote_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  code text NOT NULL,
  designation text NOT NULL,
  unit text NOT NULL DEFAULT 'u',
  quantity numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  comment text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table pour les paramètres de chiffrage
CREATE TABLE public.quote_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_version_id uuid NOT NULL UNIQUE REFERENCES public.quote_versions(id) ON DELETE CASCADE,
  n_wtg integer NOT NULL DEFAULT 1,
  turbine_model text,
  turbine_power numeric,
  hub_height numeric,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for lots
CREATE POLICY "Authenticated users can view all lots"
  ON public.lots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create lots"
  ON public.lots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lots"
  ON public.lots FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can delete lots"
  ON public.lots FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for quote_lines
CREATE POLICY "Authenticated users can view all quote lines"
  ON public.quote_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quote lines"
  ON public.quote_lines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quote lines"
  ON public.quote_lines FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can delete quote lines"
  ON public.quote_lines FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for quote_settings
CREATE POLICY "Authenticated users can view all quote settings"
  ON public.quote_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quote settings"
  ON public.quote_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quote settings"
  ON public.quote_settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can delete quote settings"
  ON public.quote_settings FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_lines_updated_at
  BEFORE UPDATE ON public.quote_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_settings_updated_at
  BEFORE UPDATE ON public.quote_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_lots_quote_version ON public.lots(quote_version_id);
CREATE INDEX idx_quote_lines_lot ON public.quote_lines(lot_id);
CREATE INDEX idx_quote_settings_version ON public.quote_settings(quote_version_id);