-- Create quote_versions table
CREATE TABLE public.quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version_label TEXT NOT NULL,
  type TEXT DEFAULT 'Budget préliminaire',
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_amount NUMERIC(12, 2) DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reference_documents table
CREATE TABLE public.reference_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES public.quote_versions(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  reference TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quote_versions
CREATE POLICY "Authenticated users can view all quote versions"
  ON public.quote_versions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quote versions"
  ON public.quote_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quote versions"
  ON public.quote_versions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can delete quote versions"
  ON public.quote_versions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for reference_documents
CREATE POLICY "Authenticated users can view all reference documents"
  ON public.reference_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reference documents"
  ON public.reference_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reference documents"
  ON public.reference_documents
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete reference documents"
  ON public.reference_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Add triggers for updating updated_at
CREATE TRIGGER update_quote_versions_updated_at
  BEFORE UPDATE ON public.quote_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();