
-- Remove user_email column from quote_comments (sensitive PII not needed)
ALTER TABLE public.quote_comments DROP COLUMN user_email;

-- Remove user_email column from project_comments (sensitive PII not needed)
ALTER TABLE public.project_comments DROP COLUMN user_email;
