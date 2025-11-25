-- Table d'archivage des variables du Calculator
CREATE TABLE calculator_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  value NUMERIC,
  quote_version_id UUID REFERENCES quote_versions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_calculator_variables_quote_version ON calculator_variables(quote_version_id);
CREATE INDEX idx_calculator_variables_project ON calculator_variables(project_id);

-- Lien variable sur les lignes de prix (pour stocker ex: $surf_PF_E01)
ALTER TABLE quote_lines ADD COLUMN linked_variable TEXT;

-- RLS policies pour calculator_variables
ALTER TABLE calculator_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view calculator variables"
  ON calculator_variables FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create calculator variables"
  ON calculator_variables FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update calculator variables"
  ON calculator_variables FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete calculator variables"
  ON calculator_variables FOR DELETE
  USING (auth.uid() IS NOT NULL);