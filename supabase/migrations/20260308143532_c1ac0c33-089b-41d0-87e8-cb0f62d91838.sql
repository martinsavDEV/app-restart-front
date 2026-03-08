
-- Turbine catalog table
CREATE TABLE public.turbine_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer text NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manufacturer, model)
);

ALTER TABLE public.turbine_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view turbine catalog" ON public.turbine_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create turbine catalog entries" ON public.turbine_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update turbine catalog" ON public.turbine_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete turbine catalog entries" ON public.turbine_catalog FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Foundation history table
CREATE TABLE public.foundation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turbine_id uuid NOT NULL REFERENCES public.turbine_catalog(id) ON DELETE CASCADE,
  hub_height numeric,
  diametre_fondation numeric,
  marge_securite numeric,
  pente_talus text,
  hauteur_cage numeric,
  project_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.foundation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view foundation history" ON public.foundation_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create foundation history" ON public.foundation_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update foundation history" ON public.foundation_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete foundation history" ON public.foundation_history FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
