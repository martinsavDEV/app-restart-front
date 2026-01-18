-- Create project_comments table for storing user comments on projects
CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_project_comments_project ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_created ON public.project_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all comments"
  ON public.project_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.project_comments FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.project_comments FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);