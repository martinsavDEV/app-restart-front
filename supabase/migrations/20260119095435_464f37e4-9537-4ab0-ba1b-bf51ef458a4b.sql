-- Create table for quote version comments
CREATE TABLE public.quote_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_version_id UUID NOT NULL REFERENCES quote_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for performance
CREATE INDEX idx_quote_comments_version ON quote_comments(quote_version_id);

-- Enable RLS
ALTER TABLE public.quote_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view quote comments"
  ON public.quote_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create quote comments"
  ON public.quote_comments FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quote comments"
  ON public.quote_comments FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quote comments"
  ON public.quote_comments FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);