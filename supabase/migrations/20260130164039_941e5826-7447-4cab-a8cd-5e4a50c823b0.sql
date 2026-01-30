-- Table des invitations
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'user',
  invited_by uuid,
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone DEFAULT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'))
);

-- RLS policies
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can manage invitations"
ON public.user_invitations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to check if email is invited
CREATE OR REPLACE FUNCTION public.is_email_invited(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_invitations
    WHERE email = _email
      AND status IN ('pending', 'accepted')
  )
$$;

-- Function to accept invitation (called after signup)
CREATE OR REPLACE FUNCTION public.accept_invitation(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO _invitation 
  FROM public.user_invitations 
  WHERE email = _email AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _invitation.role)
  ON CONFLICT DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.user_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE email = _email;
END;
$$;